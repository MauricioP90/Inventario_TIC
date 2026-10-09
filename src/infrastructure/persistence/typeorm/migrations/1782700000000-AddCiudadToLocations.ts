import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCiudadToLocations1782700000000 implements MigrationInterface {
    name = 'AddCiudadToLocations1782700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "ciudad" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN IF EXISTS "ciudad"`);
    }
}
