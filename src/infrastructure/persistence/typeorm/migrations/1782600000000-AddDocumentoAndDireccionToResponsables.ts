import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentoAndDireccionToResponsables1782600000000 implements MigrationInterface {
    name = 'AddDocumentoAndDireccionToResponsables1782600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "responsables" ADD COLUMN IF NOT EXISTS "tipo_documento" character varying DEFAULT 'CC'`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD COLUMN IF NOT EXISTS "numero_documento" character varying`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD COLUMN IF NOT EXISTS "fecha_expedicion_documento" date`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD COLUMN IF NOT EXISTS "direccion" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN IF EXISTS "direccion"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN IF EXISTS "fecha_expedicion_documento"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN IF EXISTS "numero_documento"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN IF EXISTS "tipo_documento"`);
    }
}
