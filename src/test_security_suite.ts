import { PasswordHasher } from './infrastructure/security/PasswordHasher';
import { FileSecurityValidator } from './infrastructure/storage/FileSecurityValidator';
import { Movement, MovementStatus, MovementType } from './domain/entities/Movement';
import { RegisterDeviceHeartbeat } from './application/use-cases/telemetry/RegisterDeviceHeartbeat';
import { EstadoActivo } from './domain/entities/Activo';

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

    console.log('\n================================================================');
    console.log(`RESUMEN DE PRUEBAS: ${passed} Exitosas | ${failed} Fallidas`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runSecuritySuite();

