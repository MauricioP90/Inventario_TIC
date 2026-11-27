export type AppRoleName =
    | 'super_admin'
    | 'admin'
    | 'coordinador'
    | 'tecnico'
    | 'auxiliar_inventario'
    | 'consultor';

export type PermissionKey =
    | 'activos:view'
    | 'activos:create'
    | 'activos:edit'
    | 'activos:view_precio_compra'
    | 'software:view'
    | 'software:manage'
    | 'sim_cards:view'
    | 'sim_cards:manage'
    | 'movements:view'
    | 'movements:register'
    | 'movements:cancel'
    | 'movements:report_hurto'
    | 'movements:approve_baja'
    | 'maintenance:view'
    | 'maintenance:manage'
    | 'locations:view'
    | 'locations:manage'
    | 'responsables:view'
    | 'responsables:manage'
    | 'reports:view'
    | 'catalogs:access'
    | 'swagger:access'
    | 'permissions:manage';

export interface PermissionDefinition {
    key: PermissionKey;
    module: string;
    label: string;
    description: string;
    superAdminOnly?: boolean;
}

export interface RoleDefinition {
    role: AppRoleName;
    label: string;
    description: string;
    immutable?: boolean;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        role: 'super_admin',
        label: 'Super Administrador',
        description: 'Gobernanza total del sistema, catálogos maestros, destinatarios de notificaciones, Swagger y matriz de permisos.',
        immutable: true
    },
    {
        role: 'admin',
        label: 'Administrador',
        description: 'Gestión operativa integral de activos, SIM cards, aprobaciones de baja/hurto, mantenimiento, sedes y responsables.'
    },
    {
        role: 'coordinador',
        label: 'Coordinador',
        description: 'Coordinación regional de activos, sedes, responsables, traslados, reporte de hurto (Paso 1) y consulta de mantenimiento/SIMs.'
    },
    {
        role: 'tecnico',
        label: 'Técnico',
        description: 'Soporte técnico: edición de activos, software instalado, gestión de tickets de mantenimiento, traslados y consulta de SIMs.'
    },
    {
        role: 'auxiliar_inventario',
        label: 'Auxiliar de Inventario',
        description: 'Operación logística de bodega: registro/despacho/recepción de traslados, responsables, reporte de hurto (Paso 1) y consulta de SIMs.'
    },
    {
        role: 'consultor',
        label: 'Consultor',
        description: 'Auditoría y consulta en modo Solo Lectura de activos, SIM cards, movimientos, sedes, responsables y reportes.'
    }
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
    {
        key: 'activos:view',
        module: '1. Inventario de Activos (/inventory)',
        label: 'Consultar, Filtrar y Exportar Activos',
        description: 'Permite ver el listado general de activos, hoja de vida, historial de auditoría y exportar a CSV.'
    },
    {
        key: 'activos:create',
        module: '1. Inventario de Activos (/inventory)',
        label: 'Crear Nuevo Activo',
        description: 'Habilita el botón "+ Nuevo Activo" y el endpoint POST /api/activos para dar de alta equipos.'
    },
    {
        key: 'activos:edit',
        module: '1. Inventario de Activos (/inventory)',
        label: 'Editar Ficha Técnica de Activo',
        description: 'Permite actualizar datos técnicos, serial, modelo o estado del activo (PUT /api/activos/:placa).'
    },
    {
        key: 'activos:view_precio_compra',
        module: '1. Inventario de Activos (/inventory)',
        label: 'Ver y Editar Valor de Compra ($)',
        description: 'Desenmascara el campo financiero precioCompra en API y UI (Inventario, Mantenimiento y Reportes).'
    },
    {
        key: 'software:view',
        module: '2. Software en Activos',
        label: 'Ver Software Instalado en Activos',
        description: 'Permite consultar las aplicaciones y versiones instaladas dentro de la ficha del activo.'
    },
    {
        key: 'software:manage',
        module: '2. Software en Activos',
        label: 'Instalar, Actualizar y Retirar Software',
        description: 'Permite registrar instalaciones, upgrades o desinstalaciones de software en los dispositivos.'
    },
    {
        key: 'sim_cards:view',
        module: '3. Tarjetas SIM (/sim-cards)',
        label: 'Consultar Inventario de SIM Cards (Solo Lectura)',
        description: 'Permite acceder al módulo /sim-cards y verificar qué chip está asociado a cada dispositivo.'
    },
    {
        key: 'sim_cards:manage',
        module: '3. Tarjetas SIM (/sim-cards)',
        label: 'Crear, Editar y Gestionar Reposición de SIM Cards',
        description: 'Habilita "+ Nueva SIM Card", edición de chip y cambio de estado (POST/PUT /api/sim-cards).'
    },
    {
        key: 'movements:view',
        module: '4. Movimientos y Traslados (/movements)',
        label: 'Consultar Movimientos, Soportes y Rutas',
        description: 'Permite visualizar movimientos pendientes, histórico, formatos PDF y trazabilidad de rutas.'
    },
    {
        key: 'movements:register',
        module: '4. Movimientos y Traslados (/movements)',
        label: 'Registrar, Despachar y Recibir Movimientos',
        description: 'Permite crear traslados, asignaciones, despachar guías, confirmar recepciones y adjuntar soportes.'
    },
    {
        key: 'movements:cancel',
        module: '4. Movimientos y Traslados (/movements)',
        label: 'Anular Movimientos Pendientes o En Tránsito',
        description: 'Permite anular un movimiento con motivo de auditoría antes de su recepción definitiva.'
    },
    {
        key: 'movements:report_hurto',
        module: '4. Movimientos y Traslados (/movements)',
        label: 'Reportar Hurto / Pérdida con Denuncio (Paso 1)',
        description: 'Permite radicar el reporte de HURTO_PERDIDA adjuntando el denuncio policial (queda Pendiente de Aprobación si no tiene permiso de Aprobar Baja).'
    },
    {
        key: 'movements:approve_baja',
        module: '4. Movimientos y Traslados (/movements)',
        label: 'Aprobar Baja por Hurto (Paso 2) y Registrar Baja de Activo',
        description: 'Autoriza ejecutar la BAJA definitiva del activo (BAJA_ACTIVO directo o aprobar un reporte de HURTO_PERDIDA pendiente).'
    },
    {
        key: 'maintenance:view',
        module: '5. Mantenimiento (/maintenance)',
        label: 'Consultar Tickets y Fichas de Mantenimiento',
        description: 'Permite acceder al módulo /maintenance y ver el detalle técnico de los reportes.'
    },
    {
        key: 'maintenance:manage',
        module: '5. Mantenimiento (/maintenance)',
        label: 'Abrir, Gestionar y Cerrar Tickets de Mantenimiento',
        description: 'Habilita "+ Nuevo Mantenimiento", edición de diagnósticos y cierre de soporte técnico.'
    },
    {
        key: 'locations:view',
        module: '6. Sedes y Ubicaciones (/locations)',
        label: 'Consultar Sedes y Coordenadas',
        description: 'Permite ver el directorio de sedes, ciudades, coordenadas y observaciones.'
    },
    {
        key: 'locations:manage',
        module: '6. Sedes y Ubicaciones (/locations)',
        label: 'Crear y Editar Sedes',
        description: 'Habilita "+ Nueva Sede" y la actualización de ubicaciones (POST/PUT /api/locations).'
    },
    {
        key: 'responsables:view',
        module: '7. Responsables (/responsables)',
        label: 'Consultar Directorio de Responsables',
        description: 'Permite consultar funcionarios, cargos y sedes asignadas.'
    },
    {
        key: 'responsables:manage',
        module: '7. Responsables (/responsables)',
        label: 'Crear y Editar Responsables',
        description: 'Habilita "+ Nuevo Responsable" y la edición de datos de funcionarios (POST/PUT /api/responsibles).'
    },
    {
        key: 'reports:view',
        module: '8. Reportes y Auditoría (/reports)',
        label: 'Consultar y Exportar Reportes',
        description: 'Permite acceder al módulo /reports (Altas, Bajas, Mantenimientos, Movimientos) y exportar CSV.'
    },
    {
        key: 'catalogs:access',
        module: '9. Catálogos, Notificaciones y Gobernanza (/catalogs)',
        label: 'Gestionar Catálogos Maestros, Destinatarios y Telemetría',
        description: 'Permite acceder a /catalogs (Tipos, Modelos, Áreas, Cargos, Catálogo de Apps, Destinatarios de Correo/WhatsApp y Telemetría GPS).'
    },
    {
        key: 'swagger:access',
        module: '9. Catálogos, Notificaciones y Gobernanza (/catalogs)',
        label: 'Acceso a Documentación OpenAPI (/api-docs)',
        description: 'Permite abrir el portal interactivo Swagger UI del backend.'
    },
    {
        key: 'permissions:manage',
        module: '9. Catálogos, Notificaciones y Gobernanza (/catalogs)',
        label: 'Administrar Matriz de Roles y Permisos',
        description: 'Exclusivo de Super Administrador (bloqueado por seguridad para evitar auto-bloqueo).',
        superAdminOnly: true
    }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRoleName, Record<PermissionKey, boolean>> = {
    super_admin: {
        'activos:view': true, 'activos:create': true, 'activos:edit': true, 'activos:view_precio_compra': true,
        'software:view': true, 'software:manage': true,
        'sim_cards:view': true, 'sim_cards:manage': true,
        'movements:view': true, 'movements:register': true, 'movements:cancel': true, 'movements:report_hurto': true, 'movements:approve_baja': true,
        'maintenance:view': true, 'maintenance:manage': true,
        'locations:view': true, 'locations:manage': true,
        'responsables:view': true, 'responsables:manage': true,
        'reports:view': true, 'catalogs:access': true, 'swagger:access': true, 'permissions:manage': true
    },
    admin: {
        'activos:view': true, 'activos:create': true, 'activos:edit': true, 'activos:view_precio_compra': true,
        'software:view': true, 'software:manage': true,
        'sim_cards:view': true, 'sim_cards:manage': true,
        'movements:view': true, 'movements:register': true, 'movements:cancel': true, 'movements:report_hurto': true, 'movements:approve_baja': true,
        'maintenance:view': true, 'maintenance:manage': true,
        'locations:view': true, 'locations:manage': true,
        'responsables:view': true, 'responsables:manage': true,
        'reports:view': true, 'catalogs:access': false, 'swagger:access': false, 'permissions:manage': false
    },
    coordinador: {
        'activos:view': true, 'activos:create': false, 'activos:edit': true, 'activos:view_precio_compra': false,
        'software:view': true, 'software:manage': false,
        'sim_cards:view': true, 'sim_cards:manage': false,
        'movements:view': true, 'movements:register': true, 'movements:cancel': true, 'movements:report_hurto': true, 'movements:approve_baja': false,
        'maintenance:view': true, 'maintenance:manage': false,
        'locations:view': true, 'locations:manage': true,
        'responsables:view': true, 'responsables:manage': true,
        'reports:view': true, 'catalogs:access': false, 'swagger:access': false, 'permissions:manage': false
    },
    tecnico: {
        'activos:view': true, 'activos:create': false, 'activos:edit': true, 'activos:view_precio_compra': false,
        'software:view': true, 'software:manage': true,
        'sim_cards:view': true, 'sim_cards:manage': false,
        'movements:view': true, 'movements:register': true, 'movements:cancel': true, 'movements:report_hurto': true, 'movements:approve_baja': false,
        'maintenance:view': true, 'maintenance:manage': true,
        'locations:view': true, 'locations:manage': false,
        'responsables:view': true, 'responsables:manage': false,
        'reports:view': true, 'catalogs:access': false, 'swagger:access': false, 'permissions:manage': false
    },
    auxiliar_inventario: {
        'activos:view': true, 'activos:create': false, 'activos:edit': false, 'activos:view_precio_compra': false,
        'software:view': true, 'software:manage': false,
        'sim_cards:view': true, 'sim_cards:manage': false,
        'movements:view': true, 'movements:register': true, 'movements:cancel': true, 'movements:report_hurto': true, 'movements:approve_baja': false,
        'maintenance:view': false, 'maintenance:manage': false,
        'locations:view': true, 'locations:manage': false,
        'responsables:view': true, 'responsables:manage': true,
        'reports:view': true, 'catalogs:access': false, 'swagger:access': false, 'permissions:manage': false
    },
    consultor: {
        'activos:view': true, 'activos:create': false, 'activos:edit': false, 'activos:view_precio_compra': false,
        'software:view': true, 'software:manage': false,
        'sim_cards:view': true, 'sim_cards:manage': false,
        'movements:view': true, 'movements:register': false, 'movements:cancel': false, 'movements:report_hurto': false, 'movements:approve_baja': false,
        'maintenance:view': false, 'maintenance:manage': false,
        'locations:view': true, 'locations:manage': false,
        'responsables:view': true, 'responsables:manage': false,
        'reports:view': true, 'catalogs:access': false, 'swagger:access': false, 'permissions:manage': false
    }
};
