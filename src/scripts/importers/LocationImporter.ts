import "reflect-metadata";
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from "../../data-source";
import { CreateLocation } from "../../application/use-cases/location/createLocation";
import { TypeORMLocationRepository } from "../../infrastructure/persistence/typeorm/repositories/TypeORMLocationRepository";
import { TypeORMResponsibleRepository } from "../../infrastructure/persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { LocationEntity } from "../../infrastructure/persistence/typeorm/entities/LocationEntity";
import { ResponsibleEntity } from "../../infrastructure/persistence/typeorm/entities/ResponsibleEntity";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function runImporter() {
    console.log("🚀 Iniciando importación de Ubicaciones...");

    const stats = {
        total: 0,
        success: 0,
        skipped: 0,
        errors: 0,
        duplicates: 0
    };

    try {
        await AppDataSource.initialize();
        console.log("✅ Base de datos conectada.");

        // Repositorios
        const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
        const responsibleRepo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));

        // Caso de Uso
        const createLocationUseCase = new CreateLocation(locationRepo, responsibleRepo);

        // Ruta al JSON
        const filePath = path.join(__dirname, 'data', 'sources', 'locations.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const locationsToImport = JSON.parse(rawData);

        stats.total = locationsToImport.length;
        console.log(`📊 Total a procesar: ${stats.total} registros.\n`);

        for (const data of locationsToImport) {
            try {
                // 1. Validar el formato primero (Cortocircuito)
                const esFormatoValido = data.responsableId && uuidRegex.test(data.responsableId);
                if (!esFormatoValido) {
                    console.log(`⚠️  [${data.code}] SKIPPED: Formato de ID inválido o vacío.`);
                    stats.skipped++;
                    continue;
                }
                // 2. Solo si el formato es válido, buscamos en la DB
                const responsableExiste = await responsibleRepo.findById(data.responsableId);
                if (!responsableExiste) {
                    console.log(`⚠️  [${data.code}] SKIPPED: El responsable no existe en la DB.`);
                    stats.skipped++;
                    continue;
                }
                // 2. Validar si ya existe por código
                const existe = await locationRepo.findByCode(data.code);
                if (existe) {
                    console.log(`ℹ️  [${data.code}] ALREADY EXISTS: No se sobreescribirá.`);
                    stats.duplicates++;
                    continue;
                }

                // 3. Intentar importar
                const input = {
                    ...data,
                    estado: data.estado || 'ACTIVO'
                };

                process.stdout.write(`⏳ Importando [${data.code}] ${data.nombre}... `);
                await createLocationUseCase.execute(input);
                console.log(`✅ OK`);
                stats.success++;

            } catch (err: any) {
                console.log(`❌ ERROR: ${err.message}`);
                stats.errors++;
            }
        }

        console.log("\n" + "=".repeat(40));
        console.log("✨ RESUMEN DE IMPORTACIÓN");
        console.log("=".repeat(40));
        console.log(`✅ Exitosos:     ${stats.success}`);
        console.log(`⚠️  Saltados:     ${stats.skipped} (Pendientes)`);
        console.log(`ℹ️  Duplicados:   ${stats.duplicates}`);
        console.log(`❌ Errores:      ${stats.errors}`);
        console.log(`📈 Total:        ${stats.total}`);
        console.log("=".repeat(40));

        process.exit(0);

    } catch (error) {
        console.error("💥 Error fatal durante la importación:", error);
        process.exit(1);
    }
}

runImporter();
