import { PasswordHasher } from './infrastructure/security/PasswordHasher';
import { FileSecurityValidator } from './infrastructure/storage/FileSecurityValidator';
import { Movement, MovementStatus, MovementType } from './domain/entities/Movement';
import { RegisterDeviceHeartbeat } from './application/use-cases/telemetry/RegisterDeviceHeartbeat';
import { EstadoActivo, Activo } from './domain/entities/Activo';
import { TipoActivo, EstadoTipoActivo } from './domain/entities/TipoActivo';
import { UpdateTipoActivo } from './application/use-cases/tipoActivo/UpdateTipoActivo';
import { RegisterMovement } from './application/use-cases/movement/RegisterMovement';
import { ReceiveMovement } from './application/use-cases/movement/ReceiveMovement';
import { SIMCard, EstadoSIM } from './domain/entities/SIMCard';
import { CreateSIMCard } from './application/use-cases/sim-card/CreateSIMCard';
import { UpdateSIMCard } from './application/use-cases/sim-card/UpdateSIMCard';
import { SendMovementDispatchedNotificationHandler } from './application/handlers/SendMovementDispatchedNotificationHandler';
import { MovementDispatchedDomainEvent } from './domain/events';
import { CreateActivo } from './application/use-cases/activo/CreateActivo';
import { InstallActivoSoftware } from './application/use-cases/software/InstallActivoSoftware';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

async function runSecuritySuite() {
    console.log('================================================================');
    console.log('🔒 INICIANDO BATERÍA DE PRUEBAS DE VERIFICACIÓN DE SEGURIDAD');
    console.log('================================================================\n');

    // 1. PRUEBAS DE HASHING CRIPTOGRÁFICO (scrypt)
    console.log('--- 1. PasswordHasher (scryptSync + timingSafeEqual) ---');
    const rawPass = 'MiPasswordSegura#2026';
    const hash = PasswordHasher.hash(rawPass);
    assert(hash.startsWith('scrypt$'), 'Formato del hash contiene prefijo scrypt$');
    assert(PasswordHasher.verify(rawPass, hash), 'Verificación de contraseña correcta exitosa');
    assert(!PasswordHasher.verify('PasswordIncorrecta', hash), 'Rechazo exitoso de contraseña incorrecta');
    assert(PasswordHasher.verify('admin_legacy', 'admin_legacy'), 'Compatibilidad hacia atrás con texto plano legado');
    assert(!PasswordHasher.verify('', hash), 'Rechazo de password vacía');

    // 2. PRUEBAS DE VALIDACIÓN DE ARCHIVOS Y MAGIC BYTES (FileSecurityValidator)
    console.log('\n--- 2. FileSecurityValidator (10MB, Whitelist y Magic Bytes) ---');
    
    // PDF válido (%PDF-1.4...)
    const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const validPdfBase64 = `data:application/pdf;base64,${validPdfBuffer.toString('base64')}`;
    try {
        const pdfRes = FileSecurityValidator.validateBase64(validPdfBase64, 'factura.pdf', 'facturas');
        assert(pdfRes.cleanExtension === '.pdf' && pdfRes.sanitizedFolder === 'facturas', 'Acepta PDF auténtico con cabecera %PDF-');
    } catch (e: any) {
        assert(false, `Fallo en PDF válido: ${e.message}`);
    }

    // PNG válido (89 50 4E 47 0D 0A 1A 0A)
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    const validPngBase64 = `data:image/png;base64,${validPngBuffer.toString('base64')}`;
    try {
        const pngRes = FileSecurityValidator.validateBase64(validPngBase64, 'evidencia.png', 'evidencias');
        assert(pngRes.cleanExtension === '.png' && pngRes.sanitizedFolder === 'evidencias', 'Acepta PNG auténtico con cabecera Magic Bytes PNG');
    } catch (e: any) {
        assert(false, `Fallo en PNG válido: ${e.message}`);
    }

    // Archivo malicioso falsificado (script PHP disfrazado de PDF)
    const spoofedBuffer = Buffer.from('<?php echo "Inyeccion Maliciosa"; system($_GET["cmd"]); ?>');
    const spoofedBase64 = `data:application/pdf;base64,${spoofedBuffer.toString('base64')}`;
    let spoofBlocked = false;
    try {
        FileSecurityValidator.validateBase64(spoofedBase64, 'factura_falsa.pdf', 'facturas');
    } catch (e: any) {
        spoofBlocked = true;
    }
    assert(spoofBlocked, 'Rechaza archivo malicioso PHP disfrazado con extensión .pdf');

    // Intento de Path Traversal en el folder
    let traversalBlocked = false;
    try {
        FileSecurityValidator.validateBase64(validPdfBase64, 'factura.pdf', '../../etc/shadow');
    } catch (e: any) {
        traversalBlocked = true;
    }
    assert(traversalBlocked, 'Rechaza intento de Path Traversal en el folder (../../etc/shadow)');

    // Carpeta no permitida
    let invalidFolderBlocked = false;
    try {
        FileSecurityValidator.validateBase64(validPdfBase64, 'factura.pdf', 'system32');
    } catch (e: any) {
        invalidFolderBlocked = true;
    }
    assert(invalidFolderBlocked, 'Rechaza carpeta que no esté en la lista blanca');

    // Tamaño excesivo (> 10 MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0x20); // 11 MB
    const largeBase64 = `data:application/pdf;base64,${largeBuffer.toString('base64')}`;
    let largeBlocked = false;
    try {
        FileSecurityValidator.validateBase64(largeBase64, 'pesado.pdf', 'soportes');
    } catch (e: any) {
        largeBlocked = e.message.includes('10 MB');
    }
    assert(largeBlocked, 'Rechaza archivo que supera los 10 MB');

    // 3. PRUEBAS DE VIGENCIA DE ENLACES MÁGICOS (7 DÍAS / 168 HORAS)
    console.log('\n--- 3. Movement.isMagicLinkExpired (TTL = 168h / 7 días) ---');

    // Movimiento creado hace 2 horas (Vigente)
    const recentDate = new Date(Date.now() - 2 * 3600 * 1000);
    const movRecent = new Movement({
        id: 'mov-1',
        type: MovementType.REGIONAL_TRANSFER,
        activoIds: ['act-1'],
        originLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        responsibleId: 'resp-1',
        status: MovementStatus.PENDING,
        createdAt: recentDate,
        magicLinkToken: 'token-123'
    });
    assert(!movRecent.isMagicLinkExpired(168), 'Enlace de 2 horas de antigüedad está VIGENTE');

    // Movimiento creado hace 6 días (144 horas - Vigente)
    const sixDaysAgo = new Date(Date.now() - 144 * 3600 * 1000);
    const movSixDays = new Movement({
        id: 'mov-2',
        type: MovementType.REGIONAL_TRANSFER,
        activoIds: ['act-2'],
        originLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        responsibleId: 'resp-1',
        status: MovementStatus.PENDING,
        createdAt: sixDaysAgo,
        magicLinkToken: 'token-456'
    });
    assert(!movSixDays.isMagicLinkExpired(168), 'Enlace de 6 días (144h) está VIGENTE');

    // Movimiento creado hace 8 días (192 horas - Expirado)
    const eightDaysAgo = new Date(Date.now() - 192 * 3600 * 1000);
    const movEightDays = new Movement({
        id: 'mov-3',
        type: MovementType.REGIONAL_TRANSFER,
        activoIds: ['act-3'],
        originLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        responsibleId: 'resp-1',
        status: MovementStatus.PENDING,
        createdAt: eightDaysAgo,
        magicLinkToken: 'token-789'
    });
    assert(movEightDays.isMagicLinkExpired(168), 'Enlace de 8 días (192h) está CADUCADO');

    // 4. PRUEBAS DE DETECCIÓN ACTIVA DE SABOTAJE EN TELEMETRÍA (Anti-Tampering)
    console.log('\n--- 4. RegisterDeviceHeartbeat (Anti-Sabotaje & Mock GPS) ---');

    const mockActivo: any = {
        id: 'act-1528',
        placa: '1528-003000',
        serial: 'SN-CS30-100',
        marca: 'Ciontek',
        modelo: 'CS30',
        estado: EstadoActivo.OPERACION,
        tipoActivo: { nombre: 'POS Móvil', admiteTelemetria: true },
        location: { id: 'loc-bog', nombre: 'Terminal Sur Bogotá', coordenadas: '4.5964, -74.1628' },
        responsible: { nombre: 'Operario Test', email: 'op@flm.com', telefono: '3001234567' }
    };

    const publishedEvents: any[] = [];
    const mockEventBus: any = {
        publish: async (ev: any) => { publishedEvents.push(ev); }
    };
    const mockActivoRepo: any = { findByPlaca: async () => mockActivo };
    const mockLocationRepo: any = { findAll: async () => [mockActivo.location] };
    const mockMovementRepo: any = { findAll: async () => [] };
    const mockTelemetryRepo: any = {
        getSettings: async () => ({ toleranceKm: 1.5, cooldownHours: 12, alertsEnabled: true }),
        findLatestByActivoId: async () => null,
        save: async (log: any) => log
    };

    const heartbeatUC = new RegisterDeviceHeartbeat(
        mockActivoRepo,
        mockLocationRepo,
        mockMovementRepo,
        mockTelemetryRepo,
        mockEventBus
    );

    // 4.1 Latido con permisos revocados INCLUSO estando dentro de la sede
    const revokeLog = await heartbeatUC.execute({
        placa: '1528-003000',
        latitud: 4.5964,
        longitud: -74.1628,
        ipAddress: '192.168.1.155',
        tamperingAlert: 'PERMISOS_UBICACION_REVOCADOS'
    });
    assert(revokeLog.status === 'CONTROVERSIA_UBICACION', 'Permisos revocados fuerza estado CONTROVERSIA_UBICACION incluso en sede');
    assert(revokeLog.alertSent === true, 'Permisos revocados activa disparo inmediato de alerta');
    assert(publishedEvents.length === 1 && publishedEvents[0].activoDetails.tamperingType === 'PERMISOS_UBICACION_REVOCADOS', 'Evento de dominio incluye tamperingType=PERMISOS_UBICACION_REVOCADOS');

    // 4.2 Latido con Mock GPS simulado
    const mockGpsLog = await heartbeatUC.execute({
        placa: '1528-003000',
        latitud: 4.5964,
        longitud: -74.1628,
        isMock: true
    });
    assert(mockGpsLog.status === 'CONTROVERSIA_UBICACION', 'Mock GPS fuerza estado CONTROVERSIA_UBICACION');
    assert(publishedEvents.length === 2 && publishedEvents[1].activoDetails.tamperingType === 'MOCK_LOCATION_DETECTED', 'Evento de dominio incluye tamperingType=MOCK_LOCATION_DETECTED');

    // 4.3 Latido normal legítimo en sede (sin sabotaje)
    const normalLog = await heartbeatUC.execute({
        placa: '1528-003000',
        latitud: 4.5964,
        longitud: -74.1628
    });
    assert(normalLog.status === 'CONFORME' && normalLog.alertSent === false, 'Latido legítimo en sede retorna CONFORME sin emitir alerta');

    // 6. PRUEBAS DE INTEGRIDAD DE CATÁLOGO (TipoActivo Opción A + admiteSoftware)
    console.log('\n--- 6. Reglas de Negocio TipoActivo (Descontinuación y Software) ---');

    const tipoConSoftware = new TipoActivo({
        id: 'tipo-handheld-1',
        nombre: 'Handheld',
        estado: EstadoTipoActivo.ACTIVO,
        admiteSoftware: true,
        admiteTelemetria: true
    });

    // 6a. Bloquear apagar admiteSoftware cuando existen instalaciones activas
    const updateTipoBlockedUC = new UpdateTipoActivo(
        {
            findById: async () => tipoConSoftware,
            findByNombreInsensitive: async () => null,
            update: async (t: TipoActivo) => t
        } as any,
        {
            countActiveByTipoActivoId: async () => 2
        } as any
    );

    let errorApagarSoftware = false;
    try {
        await updateTipoBlockedUC.execute('tipo-handheld-1', { admiteSoftware: false });
    } catch (e: any) {
        errorApagarSoftware = e.message.includes('INSTALADOS');
    }
    assert(errorApagarSoftware, 'UpdateTipoActivo bloquea apagar admiteSoftware si existen aplicativos INSTALADOS');

    // 6b. Permitir apagar admiteSoftware cuando no hay instalaciones activas (count = 0) y permitir inactivar catálogo
    const tipoLimpio = new TipoActivo({
        id: 'tipo-tablet-1',
        nombre: 'Tablet',
        estado: EstadoTipoActivo.ACTIVO,
        admiteSoftware: true,
        admiteTelemetria: true
    });
    const updateTipoAllowedUC = new UpdateTipoActivo(
        {
            findById: async () => tipoLimpio,
            findByNombreInsensitive: async () => null,
            update: async (t: TipoActivo) => t
        } as any,
        {
            countActiveByTipoActivoId: async () => 0
        } as any
    );
    const updatedTipo = await updateTipoAllowedUC.execute('tipo-tablet-1', {
        admiteSoftware: false,
        estado: EstadoTipoActivo.INACTIVO
    });
    assert(
        updatedTipo.admiteSoftware === false && updatedTipo.estado === EstadoTipoActivo.INACTIVO,
        'UpdateTipoActivo permite apagar admiteSoftware sin instalaciones activas e inactivar TipoActivo (descontinuar)'
    );

    // 6c. Bloquear creación de nuevos activos con TipoActivo INACTIVO
    const tipoInactivo = new TipoActivo({
        id: 'tipo-descontinuado-1',
        nombre: 'PDA Legacy',
        estado: EstadoTipoActivo.INACTIVO,
        admiteSoftware: false
    });
    const createActivoUC = new CreateActivo(
        {} as any,
        {} as any,
        {} as any,
        { findById: async () => tipoInactivo } as any
    );
    let errorTipoInactivo = false;
    try {
        await createActivoUC.execute({
            placa: '1528-009999',
            tipoActivoId: 'tipo-descontinuado-1',
            marca: 'Zebra',
            modelo: 'TC21',
            serial: 'SN-LEGACY-01',
            estado: EstadoActivo.DISPONIBLE,
            fechaIngreso: new Date(),
            locationId: 'loc-1',
            responsibleId: 'resp-1',
            areaId: 'area-1'
        });
    } catch (e: any) {
        errorTipoInactivo = e.message.includes('INACTIVO');
    }
    assert(errorTipoInactivo, 'CreateActivo rechaza registrar nuevos activos bajo un TipoActivo INACTIVO');

    // 6d. Bloquear instalación de software en activos cuyo TipoActivo tiene admiteSoftware = false
    const activoSinSoftware = new Activo({
        id: 'act-impresora-1',
        placa: '1528-004444',
        tipoActivoId: 'tipo-imp-1',
        tipoActivo: new TipoActivo({
            id: 'tipo-imp-1',
            nombre: 'Impresora Térmica',
            estado: EstadoTipoActivo.ACTIVO,
            admiteSoftware: false
        }),
        marca: 'Epson',
        modelo: 'TM-T20',
        serial: 'SN-IMP-44',
        locationId: 'loc-1',
        responsibleId: 'resp-1',
        areaId: 'area-1',
        estado: EstadoActivo.OPERACION,
        fechaIngreso: new Date()
    });
    const installSoftwareUC = new InstallActivoSoftware(
        {} as any,
        {} as any,
        { findById: async () => activoSinSoftware } as any
    );
    let errorInstallBlocked = false;
    try {
        await installSoftwareUC.execute({
            activoId: 'act-impresora-1',
            softwareVersionId: 'ver-1',
            instaladoPor: 'admin'
        });
    } catch (e: any) {
        errorInstallBlocked = e.message.includes('no admite instalación de software');
    }
    assert(errorInstallBlocked, 'InstallActivoSoftware rechaza instalar software en activos con admiteSoftware = false');

    // 7. PRUEBAS DE MOVIMIENTOS: ENUMS HUÉRFANOS, TRASLADO MULTI-SIM Y PARTÍCULA-MOLÉCULA
    console.log('\n--- 7. Integridad de Movimientos y SIMs (Partícula-Molécula) ---');

    // 7a. Rechazo en tiempo de ejecución de tipos huérfanos retirados del catálogo
    let errorOrphanType = false;
    try {
        new Movement({
            type: 'ENTREGA_COMISION' as any,
            originLocationId: 'loc-1',
            destinationLocationId: 'loc-2',
            responsibleId: 'resp-1',
            status: MovementStatus.PENDING,
            activoIds: ['act-1']
        });
    } catch (e: any) {
        errorOrphanType = e.message.includes('no es válido o fue retirado');
    }
    assert(errorOrphanType, 'Movement rechaza al crear tipos huérfanos retirados (ENTREGA_COMISION)');

    // 7b. RegisterMovement valida sede común y disponibilidad en lote SIM_TRASLADO
    const simLoc1 = new SIMCard({
        id: 'sim-1',
        iccid: '8957101000000000011',
        numero: '3101111111',
        operador: 'CLARO',
        estado: EstadoSIM.BODEGA,
        locationId: 'loc-1'
    });
    const simLoc2 = new SIMCard({
        id: 'sim-2',
        iccid: '8957101000000000022',
        numero: '3102222222',
        operador: 'MOVISTAR',
        estado: EstadoSIM.BODEGA,
        locationId: 'loc-2'
    });
    const registerSimBatchUC = new RegisterMovement(
        { findAll: async () => [] } as any,
        {} as any,
        {
            findById: async (id: string) => ({ id, nombre: id === 'loc-1' ? 'Sede A' : 'Sede B', tipo: 'OFICINA_PROPIA' })
        } as any,
        {} as any,
        {} as any,
        {
            findById: async (id: string) => (id === 'sim-1' ? simLoc1 : id === 'sim-2' ? simLoc2 : null)
        } as any
    );

    let errorMixedSimOrigin = false;
    try {
        await registerSimBatchUC.execute({
            type: MovementType.SIM_TRANSFER,
            originLocationId: 'loc-1',
            destinationLocationId: 'loc-2',
            responsibleId: 'resp-1',
            activoIds: [],
            simCardIds: ['sim-1', 'sim-2']
        });
    } catch (e: any) {
        errorMixedSimOrigin = e.message.includes('no pertenece a la sede de origen');
    }
    assert(errorMixedSimOrigin, 'RegisterMovement rechaza lote SIM_TRASLADO con SIMs de sedes distintas');

    // 7c. ReceiveMovement actualiza ubicación de SIMs adheridas al activo trasladado (Partícula-Molécula)
    const celularConSim = new Activo({
        id: 'act-cel-1',
        placa: '1528-008888',
        tipoActivoId: 'tipo-cel-1',
        marca: 'Samsung',
        modelo: 'A54',
        serial: 'SN-CEL-88',
        locationId: 'loc-1',
        responsibleId: 'resp-1',
        areaId: 'area-1',
        estado: EstadoActivo.EN_TRANSIT,
        fechaIngreso: new Date()
    });
    const simAdherida = new SIMCard({
        id: 'sim-adherida-1',
        iccid: '8957101000000000033',
        numero: '3103333333',
        operador: 'TIGO',
        estado: EstadoSIM.ASIGNADA,
        activoId: 'act-cel-1',
        locationId: 'loc-1'
    });
    const savedSims: SIMCard[] = [];
    const movTransitAsset = new Movement({
        id: 'mov-pm-1',
        type: MovementType.REGIONAL_TRANSFER,
        originLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        responsibleId: 'resp-dest',
        status: MovementStatus.EN_TRANSIT,
        activoIds: ['act-cel-1'],
        simCardIds: [],
        createdAt: new Date()
    });
    const receiveParticleUC = new ReceiveMovement(
        {
            findById: async () => movTransitAsset,
            update: async (m: Movement) => m
        } as any,
        {
            findAll: async () => [celularConSim],
            update: async (a: Activo) => a
        } as any,
        {
            findAll: async () => [simAdherida],
            save: async (s: SIMCard) => { savedSims.push(s); }
        } as any,
        {} as any,
        {
            findById: async () => ({ id: 'resp-dest', nombre: 'Receptor Sede B', area: { id: 'area-dest' } })
        } as any,
        {
            findById: async () => ({ id: 'loc-2', nombre: 'Sede B', areas: [{ id: 'area-dest' }] })
        } as any
    );

    await receiveParticleUC.execute('mov-pm-1', 'resp-dest', 'https://soportes.local/acta.png');
    assert(
        celularConSim.locationId === 'loc-2' && savedSims.length === 1 && savedSims[0].locationId === 'loc-2',
        'ReceiveMovement sincroniza locationId de SIMs adheridas al recibir el activo trasladado (Partícula-Molécula)'
    );

    // 8. CIERRE DE BRECHAS SIM (admiteSim, POR_REPOSICION, Blindaje CRUD, WhatsApp SIM_TRASLADO)
    console.log('\n--- 8. Blindaje SIM Cards (admiteSim, POR_REPOSICION, CRUD y WhatsApp) ---');

    // 8a. Bloquear apagar admiteSim si existen SIMs asignadas al tipo
    const tipoCelularConSim = new TipoActivo({
        id: 'tipo-cel-1',
        nombre: 'Celular',
        estado: EstadoTipoActivo.ACTIVO,
        admiteSim: true
    });
    const updateTipoSimBlockedUC = new UpdateTipoActivo(
        {
            findById: async () => tipoCelularConSim,
            findByNombreInsensitive: async () => null,
            update: async (t: TipoActivo) => t
        } as any,
        undefined,
        {
            countActiveByTipoActivoId: async () => 3
        } as any
    );
    let errorDisableAdmiteSim = false;
    try {
        await updateTipoSimBlockedUC.execute('tipo-cel-1', { admiteSim: false });
    } catch (e: any) {
        errorDisableAdmiteSim = e.message.includes('ASIGNADA(S)');
    }
    assert(errorDisableAdmiteSim, 'UpdateTipoActivo bloquea apagar admiteSim cuando existen SIMs asignadas a ese tipo');

    // 8b. Rechazar SIM_ASIGNACION en activos cuyo TipoActivo tiene admiteSim = false
    const activoImpresora = new Activo({
        id: 'act-imp-sim-test',
        placa: '1528-005555',
        tipoActivoId: 'tipo-imp-1',
        tipoActivo: new TipoActivo({
            id: 'tipo-imp-1',
            nombre: 'Impresora',
            estado: EstadoTipoActivo.ACTIVO,
            admiteSim: false
        }),
        marca: 'Epson',
        modelo: 'TM-T20',
        serial: 'SN-IMP-55',
        locationId: 'loc-1',
        responsibleId: 'resp-1',
        areaId: 'area-1',
        estado: EstadoActivo.OPERACION,
        fechaIngreso: new Date()
    });
    const assignToNonSimUC = new RegisterMovement(
        { findAllByActivoId: async () => [] } as any,
        { findById: async () => activoImpresora } as any,
        { findById: async () => ({ id: 'loc-1', nombre: 'Sede A', tipo: 'OFICINA_PROPIA' }) } as any,
        {} as any,
        {} as any,
        {} as any
    );
    let errorNonSimAsset = false;
    try {
        await assignToNonSimUC.execute({
            type: MovementType.SIM_ASSIGNMENT,
            originLocationId: 'loc-1',
            destinationLocationId: 'loc-1',
            responsibleId: 'resp-1',
            activoIds: ['act-imp-sim-test'],
            simCardIdToAssign: 'sim-1'
        });
    } catch (e: any) {
        errorNonSimAsset = e.message.includes('no admite instalación de tarjetas SIM');
    }
    assert(errorNonSimAsset, 'RegisterMovement rechaza SIM_ASIGNACION en activos cuyo tipo tiene admiteSim = false');

    // 8c. HURTO_PERDIDA pasa SIMs adheridas a POR_REPOSICION y las desvincula del activo dado de BAJA
    const celularHurtado = new Activo({
        id: 'act-hurtado-1',
        placa: '1528-007777',
        tipoActivoId: 'tipo-cel-1',
        tipoActivo: tipoCelularConSim,
        marca: 'Samsung',
        modelo: 'A54',
        serial: 'SN-HURTO-77',
        locationId: 'loc-1',
        responsibleId: 'resp-1',
        areaId: 'area-1',
        estado: EstadoActivo.OPERACION,
        fechaIngreso: new Date()
    });
    const simEnCelularHurtado = new SIMCard({
        id: 'sim-hurtada-1',
        iccid: '8957101000000000077',
        numero: '3107777777',
        operador: 'CLARO',
        estado: EstadoSIM.ASIGNADA,
        activoId: 'act-hurtado-1',
        locationId: 'loc-1'
    });
    let createdHurtoMovement: Movement | null = null;
    const hurtoWithSimUC = new RegisterMovement(
        {
            findAllByActivoId: async () => [],
            create: async (m: Movement) => { createdHurtoMovement = m; return m; }
        } as any,
        {
            findById: async () => celularHurtado,
            update: async (a: Activo) => a
        } as any,
        { findById: async () => ({ id: 'loc-1', nombre: 'Sede Hurto', tipo: 'OFICINA_PROPIA' }) } as any,
        { findById: async () => ({ id: 'resp-1', nombre: 'Custodio', email: 'c@flm.local' }) } as any,
        { sendMovementNotification: async () => undefined } as any,
        {
            findAll: async () => [simEnCelularHurtado],
            save: async () => {}
        } as any
    );
    await hurtoWithSimUC.execute({
        type: MovementType.THEFT_LOSS,
        originLocationId: 'loc-1',
        destinationLocationId: 'loc-1',
        responsibleId: 'resp-1',
        activoIds: ['act-hurtado-1'],
        documentUrl: 'https://soportes.local/denuncio.pdf'
    });
    assert(
        celularHurtado.estado === EstadoActivo.BAJA &&
        simEnCelularHurtado.estado === EstadoSIM.POR_REPOSICION &&
        !simEnCelularHurtado.activoId &&
        simEnCelularHurtado.locationId === 'loc-1' &&
        (createdHurtoMovement as any)?.notes?.includes('POR_REPOSICION'),
        'HURTO_PERDIDA pasa SIM adherida a POR_REPOSICION, desvincula activoId y registra alerta en notas'
    );

    // 8d. Blindaje CreateSIMCard (locationId obligatorio) y UpdateSIMCard (bloqueo manual a ASIGNADA y en tránsito)
    const createSimNoLocUC = new CreateSIMCard({ findByIccid: async () => null, save: async () => {} } as any);
    let errorCreateNoLoc = false;
    try {
        await createSimNoLocUC.execute({
            iccid: '8957101000000000099',
            numero: '3109999999',
            operador: 'WOM',
            estado: EstadoSIM.BODEGA
        });
    } catch (e: any) {
        errorCreateNoLoc = e.message.includes('ubicación inicial');
    }
    assert(errorCreateNoLoc, 'CreateSIMCard exige locationId obligatorio al registrar una nueva SIM');

    const simBodegaBlindaje = new SIMCard({
        id: 'sim-blindaje-1',
        iccid: '8957101000000000088',
        numero: '3108888888',
        operador: 'TIGO',
        estado: EstadoSIM.BODEGA,
        locationId: 'loc-1'
    });
    const updateSimBlindajeUC = new UpdateSIMCard(
        { findById: async () => simBodegaBlindaje, save: async () => {} } as any,
        {
            findAll: async () => [
                new Movement({
                    id: 'mov-sim-transit',
                    type: MovementType.SIM_TRANSFER,
                    originLocationId: 'loc-1',
                    destinationLocationId: 'loc-2',
                    responsibleId: 'resp-1',
                    status: MovementStatus.EN_TRANSIT,
                    activoIds: [],
                    simCardIds: ['sim-blindaje-1'],
                    createdAt: new Date()
                })
            ]
        } as any
    );
    let errorEditInTransit = false;
    try {
        await updateSimBlindajeUC.execute({ id: 'sim-blindaje-1', locationId: 'loc-2' });
    } catch (e: any) {
        errorEditInTransit = e.message.includes('traslado en curso');
    }
    assert(errorEditInTransit, 'UpdateSIMCard bloquea cambiar ubicación o estado mientras exista SIM_TRASLADO en curso');

    const updateSimManualAssignUC = new UpdateSIMCard(
        { findById: async () => simBodegaBlindaje, save: async () => {} } as any,
        { findAll: async () => [] } as any
    );
    let errorManualAssign = false;
    try {
        await updateSimManualAssignUC.execute({ id: 'sim-blindaje-1', estado: EstadoSIM.ASIGNADA });
    } catch (e: any) {
        errorManualAssign = e.message.includes('módulo de Movimientos');
    }
    assert(errorManualAssign, 'UpdateSIMCard impide pasar manualmente una SIM libre a estado ASIGNADA');

    // Reposición válida POR_REPOSICION -> BODEGA
    const updateSimRepositionUC = new UpdateSIMCard(
        { findById: async () => simEnCelularHurtado, save: async () => {} } as any,
        { findAll: async () => [] } as any
    );
    const simRepuesta = await updateSimRepositionUC.execute({
        id: 'sim-hurtada-1',
        iccid: '8957101000000009999',
        estado: EstadoSIM.BODEGA,
        locationId: 'loc-1'
    });
    assert(
        simRepuesta.estado === EstadoSIM.BODEGA && simRepuesta.iccid === '8957101000000009999',
        'UpdateSIMCard permite cerrar POR_REPOSICION -> BODEGA al registrar el nuevo ICCID repuesto'
    );

    // 8e. WhatsApp summary en despacho de SIM_TRASLADO (no debe decir "0 equipo(s)")
    let capturedWaSummary = '';
    const dispatchWaHandler = new SendMovementDispatchedNotificationHandler(
        undefined,
        {
            sendMovementDispatchNotification: async (p: any) => {
                capturedWaSummary = p.equiposSummary;
                return { success: true };
            }
        } as any,
        { findById: async (id: string) => ({ id, nombre: id }) } as any,
        { findById: async () => ({ id: 'resp-1', nombre: 'Receptor', telefono: '3101234567' }) } as any
    );
    const movSimWa = new Movement({
        id: 'mov-wa-sim-1',
        type: MovementType.SIM_TRANSFER,
        originLocationId: 'Bodega Bogotá',
        destinationLocationId: 'Punto TI Acacías',
        responsibleId: 'resp-1',
        status: MovementStatus.EN_TRANSIT,
        activoIds: [],
        simCardIds: ['sim-1', 'sim-2'],
        simCards: [
            { numero: '3152825959', operador: 'MOVISTAR', iccid: '8957044000223344555' },
            { numero: '3101112233', operador: 'CLARO', iccid: '8957101000000000011' }
        ],
        magicLinkToken: 'tok-wa-1',
        createdAt: new Date()
    });
    await dispatchWaHandler.handle(new MovementDispatchedDomainEvent(movSimWa, [], [], true));
    assert(
        capturedWaSummary === '2 SIM Cards: 3152825959 (MOVISTAR), 3101112233 (CLARO)',
        'WhatsApp de despacho SIM_TRASLADO formatea resumen real de SIM Cards en vez de "0 equipo(s)"'
    );

    console.log('\n================================================================');
    console.log(`RESUMEN DE PRUEBAS: ${passed} Exitosas | ${failed} Fallidas`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runSecuritySuite();

