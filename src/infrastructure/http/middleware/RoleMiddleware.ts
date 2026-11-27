import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { keycloak } from './KeycloakConfig';
import { PermissionKey, RolePermissionService } from '../../security/RolePermissionService';

/**
 * Extrae la lista de roles asignados al usuario desde el token JWT de Keycloak.
 * Normaliza variantes de super_admin y auxiliar_inventario.
 */
export function extractUserRoles(req: Request): string[] {
    const grant = (req as any).kauth?.grant;
    const tokenContent = grant?.access_token?.content;
    if (!tokenContent) return [];

    const realmRoles: string[] = tokenContent.realm_access?.roles || [];
    const resourceAccess = tokenContent.resource_access || {};
    const clientRoles: string[] = Object.values(resourceAccess).flatMap(
        (client: any) => client?.roles || []
    );

    const rawRoles = Array.from(new Set([...realmRoles, ...clientRoles]))
        .filter((r): r is string => typeof r === 'string')
        .map(r =>
            r.trim()
             .toLowerCase()
             .normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '')
             .replace(/[\s-]+/g, '_')
        );
    const normalized = new Set<string>(rawRoles);

    if (rawRoles.includes('super_admin') || rawRoles.includes('superadmin')) {
        normalized.add('super_admin');
    }
    if (rawRoles.includes('auxiliar_inventario') || rawRoles.includes('auxiliarinventario')) {
        normalized.add('auxiliar_inventario');
    }

    return Array.from(normalized);
}

/**
 * Determina si el usuario autenticado tiene el rol Super Administrador.
 */
export function isSuperAdminRequest(req: Request): boolean {
    return extractUserRoles(req).includes('super_admin');
}

/**
 * Evalúa si la petición actual posee un permiso específico según la matriz activa en RolePermissionService.
 */
export function hasPermissionRequest(req: Request, permissionKey: PermissionKey): boolean {
    const userRoles = extractUserRoles(req);
    return RolePermissionService.getInstance().hasPermission(userRoles, permissionKey);
}

/**
 * Determina si el usuario autenticado puede visualizar y editar información financiera (precioCompra).
 * Gobernado dinámicamente por 'activos:view_precio_compra' (por defecto true para 'super_admin' y 'admin').
 */
export function isAdminRequest(req: Request): boolean {
    return hasPermissionRequest(req, 'activos:view_precio_compra');
}

function toPlainEntityClone(value: unknown): any {
    if (value && typeof (value as any).toJSON === 'function') {
        const serialized = (value as any).toJSON();
        return serialized && typeof serialized === 'object' ? { ...serialized } : serialized;
    }
    return { ...(value as any) };
}

/**
 * Enmascara campos financieros sensibles (precioCompra) de un activo o lista de activos
 * cuando el solicitante no cuenta con el permiso 'activos:view_precio_compra'.
 */
export function sanitizeActivoForRole<T>(data: T, isAdmin: boolean): T {
    if (isAdmin || !data) return data;
    if (Array.isArray(data)) {
        return data.map(item => sanitizeActivoForRole(item, isAdmin)) as unknown as T;
    }
    if (typeof data === 'object') {
        const clone: any = toPlainEntityClone(data);
        if (clone && typeof clone === 'object') {
            if ('precioCompra' in clone) {
                delete clone.precioCompra;
            }
            if ('props' in clone && clone.props && typeof clone.props === 'object') {
                const propsClone = { ...clone.props };
                delete propsClone.precioCompra;
                clone.props = propsClone;
            }
        }
        return clone;
    }
    return data;
}

/**
 * Enmascara precioCompra de los activos anidados dentro de un movimiento o lista de movimientos.
 */
export function sanitizeMovementForRole<T>(data: T, isAdmin: boolean): T {
    if (isAdmin || !data) return data;
    if (Array.isArray(data)) {
        return data.map(item => sanitizeMovementForRole(item, isAdmin)) as unknown as T;
    }
    if (typeof data === 'object') {
        const clone: any = toPlainEntityClone(data);
        if (clone && typeof clone === 'object') {
            if (Array.isArray(clone.activos)) {
                clone.activos = sanitizeActivoForRole(clone.activos, isAdmin);
            }
            if (clone.props && Array.isArray(clone.props.activos)) {
                clone.props = {
                    ...clone.props,
                    activos: sanitizeActivoForRole(clone.props.activos, isAdmin)
                };
            }
        }
        return clone;
    }
    return data;
}

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC) para Express + Keycloak.
 * Nota: 'super_admin' siempre tiene autorización jerárquica superior sobre cualquier ruta protegida por roles.
 */
export function requireRoles(...allowedRoles: string[]) {
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    const protectMiddleware = keycloak.protect();

    return (req: Request, res: Response, next: NextFunction) => {
        protectMiddleware(req, res, (err?: any) => {
            if (err) {
                return next(err);
            }

            const userRoles = extractUserRoles(req);

            if (normalizedAllowed.length === 0) {
                return next();
            }

            if (userRoles.includes('super_admin')) {
                return next();
            }

            const hasPermission = normalizedAllowed.some(allowed => userRoles.includes(allowed));
            if (!hasPermission) {
                return res.status(403).json({
                    message: 'Acceso denegado: no cuenta con los privilegios necesarios para realizar esta operación.',
                    requiredRoles: allowedRoles
                });
            }

            return next();
        });
    };
}

/**
 * Middleware RBAC dinámico basado en clave de permiso de la Matriz de Roles y Permisos.
 */
export function requirePermission(permissionKey: PermissionKey) {
    const protectMiddleware = keycloak.protect();

    return (req: Request, res: Response, next: NextFunction) => {
        protectMiddleware(req, res, (err?: any) => {
            if (err) {
                return next(err);
            }

            if (!hasPermissionRequest(req, permissionKey)) {
                return res.status(403).json({
                    message: 'Acceso denegado: su rol no tiene habilitado este permiso en la Matriz de Seguridad.',
                    requiredPermission: permissionKey
                });
            }

            return next();
        });
    };
}

/**
 * Middleware que exige sesión JWT válida en Keycloak (cualquier rol autenticado).
 */
export function requireAuthenticated() {
    return keycloak.protect();
}

/**
 * Middleware híbrido para Telemetría M2M (X-Device-Api-Key en tiempo constante) o sesión JWT Keycloak.
 */
export function deviceOrKeycloakAuth(req: Request, res: Response, next: NextFunction) {
    const deviceKeyHeader = req.headers['x-device-api-key'];
    const configuredKey = process.env.TELEMETRY_API_KEY;

    if (typeof deviceKeyHeader === 'string' && deviceKeyHeader.length > 0 && configuredKey && configuredKey.length > 0) {
        const incomingBuf = Buffer.from(deviceKeyHeader, 'utf8');
        const expectedBuf = Buffer.from(configuredKey, 'utf8');
        if (incomingBuf.length === expectedBuf.length && crypto.timingSafeEqual(incomingBuf, expectedBuf)) {
            return next();
        }
        return res.status(401).json({
            message: 'Acceso denegado: X-Device-Api-Key inválida para telemetría M2M.'
        });
    }

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return keycloak.protect()(req, res, next);
    }

    return res.status(401).json({
        message: 'No autorizado: se requiere cabecera X-Device-Api-Key válida o token Bearer de Keycloak.'
    });
}
