import { Request, Response, NextFunction, RequestHandler } from 'express';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message: string;
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
    const { windowMs, max, message } = options;
    const hits = new Map<string, { count: number; resetTime: number }>();

    // Limpieza periódica para evitar fugas de memoria
    const timer = setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of hits.entries()) {
            if (now > record.resetTime) {
                hits.delete(ip);
            }
        }
    }, windowMs);
    if (timer.unref) timer.unref();

    return (req: Request, res: Response, next: NextFunction) => {
        const clientIp =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'unknown-client';

        const now = Date.now();
        const record = hits.get(clientIp);

        if (!record || now > record.resetTime) {
            hits.set(clientIp, { count: 1, resetTime: now + windowMs });
            res.setHeader('RateLimit-Limit', max);
            res.setHeader('RateLimit-Remaining', max - 1);
            res.setHeader('RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
            return next();
        }

        if (record.count >= max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
            res.setHeader('Retry-After', retryAfterSeconds);
            res.setHeader('RateLimit-Limit', max);
            res.setHeader('RateLimit-Remaining', 0);
            res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));
            return res.status(429).json({
                statusCode: 429,
                error: 'Too Many Requests',
                message,
                retryAfterSeconds
            });
        }

        record.count += 1;
        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', max - record.count);
        res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));
        return next();
    };
}

/**
 * 1. Rate limiter estricto para intentos de autenticación técnica móvil (5 intentos / 15 min)
 */
export const adminAuthRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de autenticación técnica administrativa. Por favor espere 15 minutos.'
});

/**
 * 2. Rate limiter para enlaces públicos Magic Link (25 req / 15 min en prod; 200 en dev/QA)
 */
const magicLinkMax = Number(
    process.env.MAGIC_LINK_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 25 : 200)
);

export const magicLinkRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: magicLinkMax,
    message: 'Límite de solicitudes para enlaces de recepción superado. Intente nuevamente en unos minutos.'
});

/**
 * 3. Rate limiter general para la API REST
 * En producción protege contra abuso por IP (1200 req / 15 min) manteniendo holgura para sedes tras NAT.
 * En desarrollo / pruebas E2E permite 5000 req / 15 min (configurable vía API_RATE_LIMIT_MAX).
 */
const apiGeneralMax = Number(
    process.env.API_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 1200 : 5000)
);

export const apiGeneralRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: apiGeneralMax,
    message: 'Límite global de peticiones a la API excedido. Por favor intente más tarde.'
});

