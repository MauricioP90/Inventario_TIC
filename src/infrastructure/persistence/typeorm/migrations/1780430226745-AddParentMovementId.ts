import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentMovementId1780430226745 implements MigrationInterface {
    name = 'AddParentMovementId1780430226745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" ADD "parent_movement_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "parent_movement_id"`);
    }

}
