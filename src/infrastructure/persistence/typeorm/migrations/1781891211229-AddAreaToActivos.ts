import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAreaToActivos1781891211229 implements MigrationInterface {
    name = 'AddAreaToActivos1781891211229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insertar el área NO APLICA si no existe
        await queryRunner.query(`
            INSERT INTO "areas" ("id", "code", "nombre", "estado") 
            VALUES ('8b8b9c8c-1e2a-43cf-8a27-024848bb0000', '0', 'NO APLICA', 'ACTIVO')
            ON CONFLICT ("code") DO NOTHING
        `);

        // 2. Agregar la columna area_id
        await queryRunner.query(`ALTER TABLE "activos" ADD "area_id" uuid`);

        // 3. Agregar la clave foránea
        await queryRunner.query(`
            ALTER TABLE "activos" 
            ADD CONSTRAINT "FK_activos_area" 
            FOREIGN KEY ("area_id") REFERENCES "areas"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // 4. Backfill de area_id basado en el responsable y sus sedes asociadas
        await queryRunner.query(`
            UPDATE "activos" a
            SET "area_id" = COALESCE(
                (SELECT r.area_id 
                 FROM responsables r 
                 INNER JOIN location_areas la ON la.location_id = a.location_id AND la.area_id = r.area_id
                 WHERE r.id = a.responsible_id),
                '8b8b9c8c-1e2a-43cf-8a27-024848bb0000'
            )
        `);

        // 5. Establecer valor por defecto a la columna
        await queryRunner.query(`ALTER TABLE "activos" ALTER COLUMN "area_id" SET DEFAULT '8b8b9c8c-1e2a-43cf-8a27-024848bb0000'`);

        // 6. Asegurar que no queden nulos
        await queryRunner.query(`UPDATE "activos" SET "area_id" = '8b8b9c8c-1e2a-43cf-8a27-024848bb0000' WHERE "area_id" IS NULL`);

        // 7. Hacer la columna NOT NULL
        await queryRunner.query(`ALTER TABLE "activos" ALTER COLUMN "area_id" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Eliminar clave foránea
        await queryRunner.query(`ALTER TABLE "activos" DROP CONSTRAINT "FK_activos_area"`);

        // 2. Eliminar columna
        await queryRunner.query(`ALTER TABLE "activos" DROP COLUMN "area_id"`);

        // 3. Eliminar el área NO APLICA
        await queryRunner.query(`DELETE FROM "areas" WHERE "id" = '8b8b9c8c-1e2a-43cf-8a27-024848bb0000'`);
    }
}
