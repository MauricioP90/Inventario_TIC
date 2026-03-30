import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameLocationResponsableToResponsible1774887108947 implements MigrationInterface {
    name = 'RenameLocationResponsableToResponsible1774887108947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" RENAME COLUMN "responsableId" TO "responsibleId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" RENAME COLUMN "responsibleId" TO "responsableId"`);
    }

}
