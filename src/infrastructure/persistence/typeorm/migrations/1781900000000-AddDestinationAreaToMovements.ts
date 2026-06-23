import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDestinationAreaToMovements1781900000000 implements MigrationInterface {
    name = 'AddDestinationAreaToMovements1781900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" ADD "destination_area_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "destination_area_id"`);
    }
}
