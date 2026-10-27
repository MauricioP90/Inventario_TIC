import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from './data-source';
import { TypeORMUnitOfWork } from './infrastructure/persistence/typeorm/TypeORMUnitOfWork';
import { TypeORMActivoRepository } from './infrastructure/persistence/typeorm/repositories/TypeORMActivoRepository';
import { TypeORMMovementRepository } from './infrastructure/persistence/typeorm/repositories/TypeORMMovementRepository';
import { ActivoEntity } from './infrastructure/persistence/typeorm/entities/ActivoEntity';
import { MovementEntity } from './infrastructure/persistence/typeorm/entities/MovementEntity';
import { Activo, EstadoActivo } from './domain/entities/Activo';
import { Movement, MovementStatus, MovementType } from './domain/entities/Movement';
import { RejectMovement } from './application/use-cases/movement/RejectMovement';
import { randomUUID } from 'crypto';

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

async function runAcidTests() {
    console.log(`\n${BOLD}${CYAN}==============================================================${RESET}`);
    console.log(`${BOLD}${CYAN}       SUITE DE VERIFICACIÓN DE TRANSACCIONES ACID (DDD)       ${RESET}`);
    console.log(`${BOLD}${CYAN}==============================================================${RESET}\n`);

    // 1. Inicializar conexión a la base de datos
    await AppDataSource.initialize();
    console.log(`${GREEN}✔ Conexión a Base de Datos PostgreSQL establecida exitosamente.${RESET}`);

    const unitOfWork = new TypeORMUnitOfWork(AppDataSource);
    const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
    const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));

    // Obtener llaves foráneas válidas del sistema (2 ubicaciones distintas)
    const locs = await AppDataSource.query('SELECT id, nombre FROM locations LIMIT 2');
    const locOrigin = locs[0].id;
    const locDest = locs[1].id;
    const sampleResp = (await AppDataSource.query('SELECT id FROM responsables LIMIT 1'))[0];
    const sampleArea = (await AppDataSource.query('SELECT id FROM areas LIMIT 1'))[0];
    const sampleTipo = (await AppDataSource.query('SELECT id FROM tipo_activos LIMIT 1'))[0];

    const testActivoId = randomUUID();
    const testPlaca = `ACID-${Date.now().toString().slice(-6)}`;
    const testSerial = `SN-${Date.now().toString().slice(-6)}`;

    console.log(`\n${YELLOW}--- Preparando Activo de Prueba ---${RESET}`);
    console.log(`ID: ${testActivoId} | Placa: ${testPlaca} | Serial: ${testSerial}`);
    console.log(`Ubicación Origen: ${locs[0].nombre} -> Ubicación Destino: ${locs[1].nombre}`);

    const testActivo = new Activo({
        id: testActivoId,
        placa: testPlaca,
        marca: 'ACID-TestMark',
        modelo: 'ACID-TestModel',
        serial: testSerial,
        tipoActivoId: sampleTipo.id,
        estado: EstadoActivo.DISPONIBLE,
        locationId: locOrigin,
        responsibleId: sampleResp.id,
        areaId: sampleArea.id,
        fechaIngreso: new Date()
    });

    await activoRepo.save(testActivo);
    console.log(`${GREEN}✔ Activo de prueba creado con estado inicial: ${BOLD}DISPONIBLE${RESET}`);

    try {
        // ====================================================================
        // ESCENARIO 1: ATOMICIDAD Y ROLLBACK ANTE FALLO (Inyección de Error)
        // ====================================================================
        console.log(`\n${BOLD}${CYAN}--------------------------------------------------------------${RESET}`);
        console.log(`${BOLD}${CYAN}TEST 1: Inyección de Falla -> Prueba de ROLLBACK (Atomicidad)${RESET}`);
        console.log(`${BOLD}${CYAN}--------------------------------------------------------------${RESET}`);
        console.log(`Objetivo: Modificar activo a 'MANTENIMIENTO', crear movimiento intermedio`);
        console.log(`y forzar un error antes del commit. Comprobar que NINGÚN cambio persiste.\n`);

        const ghostMovementId = randomUUID();
        let transactionFailedAsExpected = false;

        try {
            await unitOfWork.runInTransaction(async (repos) => {
                console.log(`   [Tx] 1. Modificando activo en memoria a estado 'MANTENIMIENTO'...`);
                const activoInTx = await repos.activoRepository.findById(testActivoId);
                activoInTx!.setStatus(EstadoActivo.MANTENIMIENTO);
                await repos.activoRepository.update(activoInTx!);
                console.log(`   [Tx] 2. Activo actualizado en buffer transaccional.`);

                console.log(`   [Tx] 3. Insertando movimiento intermedio en tránsito...`);
                const intermediateMov = new Movement({
                    id: ghostMovementId,
                    type: MovementType.REGIONAL_TRANSFER,
                    originLocationId: locOrigin,
                    destinationLocationId: locDest,
                    responsibleId: sampleResp.id,
                    status: MovementStatus.EN_TRANSIT,
                    activoIds: [testActivoId],
                    notes: 'Movimiento fantasma que debe desaparecer por rollback'
                });
                await repos.movementRepository.create(intermediateMov);
                console.log(`   [Tx] 4. Movimiento insertado en buffer transaccional.`);

                console.log(`   [Tx] 5. ${RED}${BOLD}Inyectando excepción crítica no recuperable...${RESET}`);
                throw new Error('ERR_SIMULATED_FAILURE_ACID_ROLLBACK');
            });
        } catch (err: any) {
            if (err.message === 'ERR_SIMULATED_FAILURE_ACID_ROLLBACK') {
                transactionFailedAsExpected = true;
                console.log(`   ${YELLOW}✔ Excepción interceptada en el boundary transaccional: ${err.message}${RESET}`);
            } else {
                throw err;
            }
        }

        // VERIFICACIÓN POST-ROLLBACK CONSULTANDO LA BD DIRECTA Y FRESCA
        console.log(`\n${BOLD}Verificando estado real en PostgreSQL post-fallo:${RESET}`);
        const activoAfterRollback = await activoRepo.findById(testActivoId);
        const ghostMovAfterRollback = await movementRepo.findById(ghostMovementId);

        console.log(` - Estado del Activo en BD: ${BOLD}${activoAfterRollback?.estado}${RESET} (Esperado: ${BOLD}DISPONIBLE${RESET})`);
        console.log(` - Existencia del Movimiento intermedio: ${ghostMovAfterRollback ? 'SÍ EXISTE (ERROR)' : 'NO EXISTE (CORRECTO)'}`);

        if (activoAfterRollback?.estado === EstadoActivo.DISPONIBLE && !ghostMovAfterRollback && transactionFailedAsExpected) {
            console.log(`\n${GREEN}${BOLD}✔ RESULTADO TEST 1: PASÓ EXITOSAMENTE.${RESET}`);
            console.log(`${GREEN}  La base de datos ejecutó un ROLLBACK completo. Cero corrupción o estados parciales (Atomicidad demostrada).${RESET}`);
        } else {
            console.error(`\n${RED}${BOLD}✖ RESULTADO TEST 1: FALLÓ. Se detectó persistencia parcial tras error.${RESET}`);
            process.exit(1);
        }

        // ====================================================================
        // ESCENARIO 2: COMMIT EXITOSO Y DURABILIDAD MULTIENTIDAD
        // ====================================================================
        console.log(`\n${BOLD}${CYAN}--------------------------------------------------------------${RESET}`);
        console.log(`${BOLD}${CYAN}TEST 2: Transacción Exitosa -> Prueba de COMMIT (Consistencia y Durabilidad)${RESET}`);
        console.log(`${BOLD}${CYAN}--------------------------------------------------------------${RESET}`);
        console.log(`Objetivo: Modificar activo a 'MANTENIMIENTO' y registrar movimiento.`);
        console.log(`Comprobar que todas las mutaciones se consolidan de forma atómica en BD.\n`);

        const validMovementId = randomUUID();

        await unitOfWork.runInTransaction(async (repos) => {
            console.log(`   [Tx] 1. Actualizando activo a 'MANTENIMIENTO'...`);
            const activoInTx = await repos.activoRepository.findById(testActivoId);
            activoInTx!.setStatus(EstadoActivo.MANTENIMIENTO);
            await repos.activoRepository.update(activoInTx!);

            console.log(`   [Tx] 2. Creando movimiento de mantenimiento...`);
            const validMov = new Movement({
                id: validMovementId,
                type: 'INGRESO_MANTENIMIENTO',
                originLocationId: locOrigin,
                destinationLocationId: locOrigin,
                responsibleId: sampleResp.id,
                status: MovementStatus.RECEIVED,
                activoIds: [testActivoId],
                notes: 'Movimiento consolidado atómicamente con éxito'
            });
            await repos.movementRepository.create(validMov);
            console.log(`   [Tx] 3. Transacción lista para commit sin errores.`);
        });

        const activoAfterCommit = await activoRepo.findById(testActivoId);
        const movAfterCommit = await movementRepo.findById(validMovementId);

        console.log(`\n${BOLD}Verificando estado real en PostgreSQL post-commit:${RESET}`);
        console.log(` - Estado del Activo en BD: ${BOLD}${activoAfterCommit?.estado}${RESET} (Esperado: ${BOLD}MANTENIMIENTO${RESET})`);
        console.log(` - Movimiento persistido en BD: ${movAfterCommit ? 'SÍ, CORRECTO' : 'NO (ERROR)'}`);

        if (activoAfterCommit?.estado === EstadoActivo.MANTENIMIENTO && movAfterCommit) {
            console.log(`\n${GREEN}${BOLD}✔ RESULTADO TEST 2: PASÓ EXITOSAMENTE.${RESET}`);
            console.log(`${GREEN}  Ambas entidades se consolidaron atómicamente en un solo COMMIT de TypeORM.${RESET}`);
        } else {
            console.error(`\n${RED}${BOLD}✖ RESULTADO TEST 2: FALLÓ. Inconsistencia detectada.${RESET}`);
            process.exit(1);
        }

        // ====================================================================
        // ESCENARIO 3: CASO DE USO REAL REJECTMOVEMENT CON IUNITOFWORK
        // ====================================================================
        console.log(`\n${BOLD}${CYAN}--------------------------------------------------------------${RESET}`);
        console.log(`${BOLD}${CYAN}TEST 3: Caso de Uso Real 'RejectMovement' orquestado con UnitOfWork${RESET}`);
        console.log(`${BOLD}${CYAN}--------------------------------------------------------------${RESET}`);
        console.log(`Objetivo: Rechazar un movimiento EN_TRANSIT real. Verificar que:`);
        console.log(`1. El movimiento original pasa a 'CANCELLED' con nota del motivo.`);
        console.log(`2. El activo involucrado pasa a 'RECHAZADO'.`);
        console.log(`3. Se crea automáticamente el 'RETORNO_POR_RECHAZO' apuntando al padre.\n`);

        const transitMovementId = randomUUID();
        const transitMovement = new Movement({
            id: transitMovementId,
            type: MovementType.REGIONAL_TRANSFER,
            originLocationId: locOrigin,
            destinationLocationId: locDest,
            responsibleId: sampleResp.id,
            status: MovementStatus.EN_TRANSIT,
            activoIds: [testActivoId],
            notes: 'Traslado inicial en camino',
            shippedAt: new Date()
        });
        await movementRepo.create(transitMovement);

        const rejectUseCase = new RejectMovement(movementRepo, activoRepo, unitOfWork);
        const rejectionReason = 'Equipo llegó con pantalla averiada (Prueba ACID)';

        console.log(`   [UseCase] Ejecutando RejectMovement.execute('${transitMovementId}')...`);
        const returnMovement = await rejectUseCase.execute(transitMovementId, rejectionReason);

        console.log(`   [UseCase] Movimiento de retorno generado con ID: ${returnMovement.id}`);

        // Verificaciones
        const originalMovAfterReject = await movementRepo.findById(transitMovementId);
        const activoAfterReject = await activoRepo.findById(testActivoId);
        const returnMovFromDb = await movementRepo.findById(returnMovement.id!);

        console.log(`\n${BOLD}Verificando integridad del Aggregate Root y consistencia en BD:${RESET}`);
        console.log(` - Estado Movimiento Original: ${BOLD}${originalMovAfterReject?.status}${RESET} (Esperado: ${BOLD}CANCELLED${RESET})`);
        console.log(` - Notas del Movimiento Original: "${originalMovAfterReject?.notes?.replace(/\n/g, ' ')}"`);
        console.log(` - Estado del Activo en BD: ${BOLD}${activoAfterReject?.estado}${RESET} (Esperado: ${BOLD}RECHAZADO${RESET})`);
        console.log(` - Tipo del nuevo Movimiento: ${BOLD}${returnMovFromDb?.type}${RESET} (Esperado: ${BOLD}RETORNO_POR_RECHAZO${RESET})`);
        console.log(` - Enlace padre-hijo (parentMovementId): ${returnMovFromDb?.parentMovementId} === ${transitMovementId}`);

        if (
            originalMovAfterReject?.status === MovementStatus.CANCELLED &&
            originalMovAfterReject?.notes?.includes(rejectionReason) &&
            activoAfterReject?.estado === EstadoActivo.RECHAZADO &&
            returnMovFromDb?.type === 'RETORNO_POR_RECHAZO' &&
            returnMovFromDb?.parentMovementId === transitMovementId
        ) {
            console.log(`\n${GREEN}${BOLD}✔ RESULTADO TEST 3: PASÓ EXITOSAMENTE.${RESET}`);
            console.log(`${GREEN}  Flujo de rechazo completado con integridad referencial y atomicidad total.${RESET}`);
        } else {
            console.error(`\n${RED}${BOLD}✖ RESULTADO TEST 3: FALLÓ.${RESET}`);
            process.exit(1);
        }

        // ====================================================================
        // LIMPIEZA DE DATOS DE PRUEBA
        // ====================================================================
        console.log(`\n${YELLOW}--- Limpiando registros temporales de prueba en BD ---${RESET}`);
        await AppDataSource.query(`DELETE FROM movements WHERE id IN ($1, $2, $3)`, [
            validMovementId,
            transitMovementId,
            returnMovement.id
        ]);
        await AppDataSource.query(`DELETE FROM activos WHERE id = $1`, [testActivoId]);
        console.log(`${GREEN}✔ Datos de prueba eliminados. Base de datos limpia e intacta.${RESET}`);

        console.log(`\n${BOLD}${GREEN}==============================================================${RESET}`);
        console.log(`${BOLD}${GREEN}      ¡TODAS LAS PRUEBAS DE TRANSACCIONALIDAD ACID PASARON!     ${RESET}`);
        console.log(`${BOLD}${GREEN}==============================================================${RESET}\n`);

    } catch (error) {
        console.error(`${RED}Error durante las pruebas ACID:${RESET}`, error);
        // Intentar limpiar en caso de error
        try {
            await AppDataSource.query(`DELETE FROM activos WHERE id = $1`, [testActivoId]);
        } catch (_) {}
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
        console.log('Conexión a la base de datos cerrada.');
    }
}

runAcidTests();
