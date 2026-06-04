import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateActivoBodegaToDisponible1780517000000 implements MigrationInterface {
    name = 'MigrateActivoBodegaToDisponible1780517000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "activos" SET "estado" = 'DISPONIBLE' WHERE "estado" = 'BODEGA'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "activos" SET "estado" = 'BODEGA' WHERE "estado" = 'DISPONIBLE'`);
    }
}
