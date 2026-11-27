import { Router, Request, Response } from 'express';
import {
    RolePermissionService,
    ROLE_DEFINITIONS,
    PERMISSION_DEFINITIONS
} from '../../security/RolePermissionService';
import { requireAuthenticated, requirePermission } from '../middleware/RoleMiddleware';

export const rolePermissionRouter = Router();
const permissionService = RolePermissionService.getInstance();

/**
 * GET /api/role-permissions
 * Retorna las definiciones de roles, definiciones de permisos y la matriz activa.
 * Accesible para cualquier usuario autenticado para que el frontend (RoleService) sincronice permisos en tiempo real.
 */
rolePermissionRouter.get('/', requireAuthenticated(), async (_req: Request, res: Response) => {
    try {
        res.json({
            roles: ROLE_DEFINITIONS,
            permissions: PERMISSION_DEFINITIONS,
            matrix: permissionService.getMatrix()
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

/**
 * PUT /api/role-permissions/:role
 * Actualiza los permisos de un rol específico (Exclusivo Super Administrador).
 */
rolePermissionRouter.put('/:role', requirePermission('permissions:manage'), async (req: Request, res: Response) => {
    try {
        const { role } = req.params;
        const { permissions } = req.body || {};
        if (!permissions || typeof permissions !== 'object') {
            return res.status(400).json({ message: 'Debe proporcionar un objeto permissions válido.' });
        }

        const grantContent = (req as any).kauth?.grant?.access_token?.content;
        const updatedBy = grantContent?.preferred_username || grantContent?.email || 'super_admin';

        const updated = await permissionService.updateRolePermissions(String(role), permissions, updatedBy);
        res.json({
            role,
            permissions: updated,
            matrix: permissionService.getMatrix()
        });
    } catch (error) {
        const msg = (error as Error).message;
        const status = msg.includes('inmutables') || msg.includes('no es un rol válido') ? 400 : 500;
        res.status(status).json({ message: msg });
    }
});

/**
 * POST /api/role-permissions/reset
 * Restaura toda la matriz de permisos a los valores oficiales por defecto (Exclusivo Super Administrador).
 */
rolePermissionRouter.post('/reset', requirePermission('permissions:manage'), async (req: Request, res: Response) => {
    try {
        const grantContent = (req as any).kauth?.grant?.access_token?.content;
        const updatedBy = grantContent?.preferred_username || grantContent?.email || 'super_admin';
        const matrix = await permissionService.resetToDefaults(updatedBy);
        res.json({
            message: 'Matriz de permisos restaurada a los valores por defecto.',
            matrix
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});
