import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMovementTable1775829354922 implements MigrationInterface {
    name = 'CreateMovementTable1775829354922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "movements" ("id" uuid NOT NULL, "type" character varying NOT NULL, "origin_location_id" uuid NOT NULL, "destination_location_id" uuid NOT NULL, "responsible_id" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "notes" text, "evidence_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "shipped_at" TIMESTAMP, "received_at" TIMESTAMP, CONSTRAINT "PK_5a8e3da15ab8f2ce353e7f58f67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movement_activos" ("movement_id" uuid NOT NULL, "activo_id" uuid NOT NULL, CONSTRAINT "PK_fb5dcbe241560b1e84c9a980911" PRIMARY KEY ("movement_id", "activo_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d91743ed56dd745c391e1e4b76" ON "movement_activos" ("movement_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c24084469c1f6e4c118db638aa" ON "movement_activos" ("activo_id") `);
        await queryRunner.query(`ALTER TABLE "responsables" DROP CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce"`);
        await queryRunner.query(`ALTER TABLE "responsables" ALTER COLUMN "role_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_63b701b82afff55208b70a9dfb3" FOREIGN KEY ("origin_location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_873623c83fe120c66a4c38b800c" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_55236df015383fd98adea91c1fb" FOREIGN KEY ("responsible_id") REFERENCES "responsables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movement_activos" ADD CONSTRAINT "FK_d91743ed56dd745c391e1e4b763" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movement_activos" ADD CONSTRAINT "FK_c24084469c1f6e4c118db638aae" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movement_activos" DROP CONSTRAINT "FK_c24084469c1f6e4c118db638aae"`);
        await queryRunner.query(`ALTER TABLE "movement_activos" DROP CONSTRAINT "FK_d91743ed56dd745c391e1e4b763"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_55236df015383fd98adea91c1fb"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_873623c83fe120c66a4c38b800c"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_63b701b82afff55208b70a9dfb3"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce"`);
        await queryRunner.query(`ALTER TABLE "responsables" ALTER COLUMN "role_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c24084469c1f6e4c118db638aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d91743ed56dd745c391e1e4b76"`);
        await queryRunner.query(`DROP TABLE "movement_activos"`);
        await queryRunner.query(`DROP TABLE "movements"`);
    }

}
