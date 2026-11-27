import { AppDataSource } from '../../data-source';
import { RolePermissionEntity } from '../database/entities/RolePermissionEntity';
import {
    AppRoleName,
    DEFAULT_ROLE_PERMISSIONS,
    PERMISSION_DEFINITIONS,
    PermissionKey,
    ROLE_DEFINITIONS
} from './role-permissions.catalog';

export {
    AppRoleName,
    DEFAULT_ROLE_PERMISSIONS,
    PERMISSION_DEFINITIONS,
    PermissionDefinition,
    PermissionKey,
    ROLE_DEFINITIONS,
    RoleDefinition
} from './role-permissions.catalog';

export class RolePermissionService {
    private static instance: RolePermissionService;
    private matrix: Record<AppRoleName, Record<PermissionKey, boolean>>;

    private constructor() {
        this.matrix = this.cloneDefaultMatrix();
    }

    public static getInstance(): RolePermissionService {
        if (!RolePermissionService.instance) {
            RolePermissionService.instance = new RolePermissionService();
        }
        return RolePermissionService.instance;
    }

    private cloneDefaultMatrix(): Record<AppRoleName, Record<PermissionKey, boolean>> {
        return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }

    public normalizeRoleName(role: string): AppRoleName | null {
        const lower = (role || '').trim().toLowerCase();
        if (lower === 'super_admin' || lower === 'super-admin' || lower === 'superadmin') return 'super_admin';
        if (lower === 'admin') return 'admin';
        if (lower === 'coordinador') return 'coordinador';
        if (lower === 'tecnico') return 'tecnico';
        if (lower === 'auxiliar_inventario' || lower === 'auxiliar-inventario') return 'auxiliar_inventario';
        if (lower === 'consultor') return 'consultor';
        return null;
    }

    public async loadFromDatabase(): Promise<void> {
        if (!AppDataSource.isInitialized) return;
        try {
            const repo = AppDataSource.getRepository(RolePermissionEntity);
            const rows = await repo.find();
            const fresh = this.cloneDefaultMatrix();

            for (const row of rows) {
                const role = this.normalizeRoleName(row.roleName);
                if (!role || role === 'super_admin') continue;
                if (row.permissions && typeof row.permissions === 'object') {
                    for (const def of PERMISSION_DEFINITIONS) {
                        if (def.superAdminOnly) {
                            fresh[role][def.key] = false;
                        } else if (typeof row.permissions[def.key] === 'boolean') {
                            fresh[role][def.key] = row.permissions[def.key];
                        }
                    }
                }
            }
            for (const def of PERMISSION_DEFINITIONS) {
                fresh.super_admin[def.key] = true;
            }
            this.matrix = fresh;
        } catch (err) {
            console.warn('⚠️ [RolePermissionService] No se pudo cargar matriz desde BD, usando valores por defecto:', (err as Error).message);
        }
    }

    public getMatrix(): Record<AppRoleName, Record<PermissionKey, boolean>> {
        return JSON.parse(JSON.stringify(this.matrix));
    }

    public hasPermission(userRoles: string[], permissionKey: PermissionKey): boolean {
        if (!Array.isArray(userRoles) || userRoles.length === 0) return false;
        for (const rawRole of userRoles) {
            const role = this.normalizeRoleName(rawRole);
            if (!role) continue;
            if (role === 'super_admin') return true;
            if (this.matrix[role]?.[permissionKey] === true) {
                return true;
            }
        }
        return false;
    }

    public async updateRolePermissions(
        rawRole: string,
        incomingPermissions: Record<string, boolean>,
        updatedBy?: string
    ): Promise<Record<PermissionKey, boolean>> {
        const role = this.normalizeRoleName(rawRole);
        if (!role) {
            throw new Error(`El rol '${rawRole}' no es un rol válido del sistema.`);
        }
        if (role === 'super_admin') {
            throw new Error('Los permisos del rol Super Administrador son inmutables por seguridad.');
        }

        const updatedRolePerms: Record<PermissionKey, boolean> = {
            ...DEFAULT_ROLE_PERMISSIONS[role],
            ...this.matrix[role]
        };

        for (const def of PERMISSION_DEFINITIONS) {
            if (def.superAdminOnly) {
                updatedRolePerms[def.key] = false;
            } else if (typeof incomingPermissions[def.key] === 'boolean') {
                updatedRolePerms[def.key] = incomingPermissions[def.key];
            }
        }

        this.matrix[role] = updatedRolePerms;

        if (AppDataSource.isInitialized) {
            const repo = AppDataSource.getRepository(RolePermissionEntity);
            await repo.save({
                roleName: role,
                permissions: updatedRolePerms,
                updatedBy: updatedBy || 'super_admin'
            });
        }

        return { ...updatedRolePerms };
    }

    public async resetToDefaults(updatedBy?: string): Promise<Record<AppRoleName, Record<PermissionKey, boolean>>> {
        this.matrix = this.cloneDefaultMatrix();
        if (AppDataSource.isInitialized) {
            const repo = AppDataSource.getRepository(RolePermissionEntity);
            for (const roleDef of ROLE_DEFINITIONS) {
                await repo.save({
                    roleName: roleDef.role,
                    permissions: this.matrix[roleDef.role],
                    updatedBy: updatedBy || 'super_admin'
                });
            }
        }
        return this.getMatrix();
    }
}
