import { MigrationInterface, QueryRunner } from "typeorm";

export class RestoreLocationResponsibleNotNullFinal1774630577559 implements MigrationInterface {
    name = 'RestoreLocationResponsibleNotNullFinal1774630577559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "responsableId" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "responsableId" DROP NOT NULL`);
    }

}
