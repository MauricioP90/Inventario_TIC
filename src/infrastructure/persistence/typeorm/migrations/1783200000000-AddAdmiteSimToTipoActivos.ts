import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdmiteSimToTipoActivos1783200000000 implements MigrationInterface {
    name = 'AddAdmiteSimToTipoActivos1783200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tipo_activos" ADD COLUMN IF NOT EXISTS "admite_sim" boolean NOT NULL DEFAULT false
        `);

        // Habilitar admite_sim automáticamente para tipos que ya poseen SIM Cards asignadas o pertenecen a categorías móviles
        await queryRunner.query(`
            UPDATE "tipo_activos" ta
            SET "admite_sim" = true
            WHERE EXISTS (
                SELECT 1
                FROM "activos" a
                INNER JOIN "sim_cards" s ON s.activo_id = a.id
                WHERE a.tipo_activo_id = ta.id
            )
            OR LOWER(ta.nombre) ~ '(celular|movil|móvil|tablet|pos|handheld|pda|cs30|router|modem|módem|datafono|datáfono)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tipo_activos" DROP COLUMN IF EXISTS "admite_sim"`);
    }
}

