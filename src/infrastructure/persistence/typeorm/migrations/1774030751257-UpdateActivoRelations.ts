import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateActivoRelations1774030751257 implements MigrationInterface {
    name = 'UpdateActivoRelations1774030751257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activos" ADD "location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "activos" ADD "responsible_id" uuid`);
        await queryRunner.query(`ALTER TABLE "activos" ADD CONSTRAINT "FK_7cb12685b3817fbf6666972cefe" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activos" ADD CONSTRAINT "FK_b4bdfafca05178556b34d1e58c4" FOREIGN KEY ("responsible_id") REFERENCES "responsables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activos" DROP CONSTRAINT "FK_b4bdfafca05178556b34d1e58c4"`);
        await queryRunner.query(`ALTER TABLE "activos" DROP CONSTRAINT "FK_7cb12685b3817fbf6666972cefe"`);
        await queryRunner.query(`ALTER TABLE "activos" DROP COLUMN "responsible_id"`);
        await queryRunner.query(`ALTER TABLE "activos" DROP COLUMN "location_id"`);
    }

}
