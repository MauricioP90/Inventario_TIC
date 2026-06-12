import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrecioCompraToActivos1781368000000 implements MigrationInterface {
    name = 'AddPrecioCompraToActivos1781368000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activos" ADD COLUMN IF NOT EXISTS "precio_compra" DECIMAL(12,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activos" DROP COLUMN IF EXISTS "precio_compra"`);
    }
}
