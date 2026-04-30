import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReceiverFieldsToMovement1777559642535 implements MigrationInterface {
    name = 'AddReceiverFieldsToMovement1777559642535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" ADD "receiver_id" uuid`);
        await queryRunner.query(`ALTER TABLE "movements" ADD "received_evidence_url" character varying`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "tipo"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "tipo" character varying NOT NULL DEFAULT 'OFICINA'`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_5f65f01214d360e6a0a718a0d70" FOREIGN KEY ("receiver_id") REFERENCES "responsables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_5f65f01214d360e6a0a718a0d70"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "tipo"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "tipo" character varying(20) NOT NULL DEFAULT 'OFICINA'`);
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "received_evidence_url"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP COLUMN "receiver_id"`);
    }

}
