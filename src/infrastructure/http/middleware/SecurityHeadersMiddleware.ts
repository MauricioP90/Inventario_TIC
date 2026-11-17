import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Prevenir que el navegador interprete MIME types incorrectos (MIME sniffing)
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 2. Prevenir Clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // 3. Proteger la política de Referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 4. Bloquear APIs de hardware no utilizadas
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=()');

    // 5. HSTS en producción (Forzar HTTPS durante 1 año)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // 6. Remover cabeceras de identificación de tecnología
    res.removeHeader('X-Powered-By');

    next();
}

