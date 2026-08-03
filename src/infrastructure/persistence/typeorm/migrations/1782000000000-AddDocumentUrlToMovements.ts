import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentUrlToMovements1782000000000 implements MigrationInterface {
    name = 'AddDocumentUrlToMovements1782000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agrega columna document_url para guardar el comodato/acta de soporte
        // cargado al REGISTRAR el movimiento, separado de evidence_url (guía de despacho).
        await queryRunner.query(
            `ALTER TABLE "movements" ADD COLUMN IF NOT EXISTS "document_url" TEXT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "movements" DROP COLUMN IF EXISTS "document_url"`
        );
    }
}
