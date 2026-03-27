import { MigrationInterface, QueryRunner } from "typeorm";

export class RestoreLocationResponsibleNotNull1774630279999 implements MigrationInterface {
    name = 'RestoreLocationResponsibleNotNull1774630279999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "responsableId" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "responsableId" DROP NOT NULL`);
    }

}
