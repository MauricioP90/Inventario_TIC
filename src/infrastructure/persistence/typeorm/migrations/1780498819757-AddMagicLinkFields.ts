import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMagicLinkFields1780498819757 implements MigrationInterface {
    name = 'AddMagicLinkFields1780498819757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" ADD "magic_link_token" character varying`);
        await queryRunner.query(`ALTER TABLE "movements" ADD "physical_receiver_name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "physical_receiver_name"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "magic_link_token"`);
    }

}
