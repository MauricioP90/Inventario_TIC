import { Request, Response, NextFunction, RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { keycloak } from './KeycloakConfig';

/**
 * Extrae todos los roles asignados al usuario en Keycloak (tanto realm roles como client roles)
 */
export function extractUserRoles(req: Request): string[] {
    const kauth = (req as any).kauth;
    const tokenContent = kauth?.grant?.access_token?.content;

    const realmRoles: string[] = tokenContent?.realm_access?.roles || [];
    const clientResource = process.env.KEYCLOAK_CLIENT_ID || 'inventory-backend';
    const clientRoles: string[] = tokenContent?.resource_access?.[clientResource]?.roles || [];

    const allRoles = [...realmRoles, ...clientRoles];
    return allRoles.map(r => r.toLowerCase().trim());
}

/**
 * Middleware para exigir uno o más roles específicos.
 * Es insensible a mayúsculas/minúsculas y primero garantiza que la petición esté autenticada con Keycloak.
 */
export function requireRoles(...allowedRoles: string[]): RequestHandler {
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim());
    const protectMiddleware = keycloak.protect();

    return (req: Request, res: Response, next: NextFunction) => {
        protectMiddleware(req, res, () => {
            const userRoles = extractUserRoles(req);

            const hasPermission = normalizedAllowed.some(allowed => userRoles.includes(allowed));
            if (!hasPermission) {
                return res.status(403).json({
                    statusCode: 403,
                    error: 'Forbidden',
                    message: `Acceso denegado: se requiere uno de los siguientes roles [${allowedRoles.join(', ')}].`
                });
            }

            next();
        });
    };
}

/**
 * Middleware híbrido para el agente de telemetría de arranque:
 * Permite autenticación M2M mediante cabecera X-Device-Api-Key (con comparación en tiempo constante)
 * o mediante sesión/token JWT de Keycloak.
 */
export const deviceOrKeycloakAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const expectedDeviceKey = process.env.DEVICE_TELEMETRY_API_KEY || 'flm-telemetry-secret-key-2026';
    const providedDeviceKey = req.headers['x-device-api-key'] as string | undefined;

    if (providedDeviceKey && typeof providedDeviceKey === 'string') {
        const expectedBuffer = Buffer.from(expectedDeviceKey, 'utf8');
        const providedBuffer = Buffer.from(providedDeviceKey, 'utf8');

        if (expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer)) {
            return next();
        }
    }

    return keycloak.protect()(req, res, next);
};
