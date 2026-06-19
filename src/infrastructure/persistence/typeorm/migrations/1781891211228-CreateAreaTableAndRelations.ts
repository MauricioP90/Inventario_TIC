import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAreaTableAndRelations1781891211228 implements MigrationInterface {
    name = 'CreateAreaTableAndRelations1781891211228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maintenance_reports" DROP CONSTRAINT "FK_maintenance_reports_activo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_maintenance_reports_activo_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_maintenance_reports_estado"`);
        await queryRunner.query(`CREATE TABLE "areas" ("id" uuid NOT NULL, "code" character varying NOT NULL, "nombre" character varying NOT NULL, "estado" character varying NOT NULL, CONSTRAINT "UQ_1ce4e4f7cd8d820081bc74aa16c" UNIQUE ("code"), CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "location_areas" ("location_id" uuid NOT NULL, "area_id" uuid NOT NULL, CONSTRAINT "PK_c3b06906e5cbf80c7175fac9a13" PRIMARY KEY ("location_id", "area_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1e19acb3538d88af0482188e09" ON "location_areas" ("location_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_eca32c4f59a254d2db377a41e5" ON "location_areas" ("area_id") `);
        await queryRunner.query(`ALTER TABLE "responsables" ADD "area_id" uuid`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" DROP COLUMN "movimiento_origen_id"`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" ADD "movimiento_origen_id" character varying`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD CONSTRAINT "FK_a33c985a59118a0ad56681dcb63" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" ADD CONSTRAINT "FK_21ca159657fa7399723feeaba46" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "location_areas" ADD CONSTRAINT "FK_1e19acb3538d88af0482188e09b" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "location_areas" ADD CONSTRAINT "FK_eca32c4f59a254d2db377a41e52" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Seed baseline areas
        await queryRunner.query(`
            INSERT INTO "areas" ("id", "code", "nombre", "estado") VALUES
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0001', '1', 'GERENCIA GENERAL', 'ACTIVO'),
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0002', '2', 'DIRECCION TIC', 'ACTIVO'),
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0003', '3', 'DIR FINANCIERA', 'ACTIVO'),
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0004', '4', 'DIRECCION ADMINISTRATIVA', 'ACTIVO'),
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0005', '5', 'DIRECCION NACIONAL TRANSPORTE DE PASAJEROS', 'ACTIVO'),
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0006', '6', 'DIRECCION NACIONAL DE CARGA', 'ACTIVO'),
            ('8b8b9c8c-1e2a-43cf-8a27-024848bb0007', '7', 'DIRECCION SERVICIOS PROPIOS', 'ACTIVO')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location_areas" DROP CONSTRAINT "FK_eca32c4f59a254d2db377a41e52"`);
        await queryRunner.query(`ALTER TABLE "location_areas" DROP CONSTRAINT "FK_1e19acb3538d88af0482188e09b"`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" DROP CONSTRAINT "FK_21ca159657fa7399723feeaba46"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP CONSTRAINT "FK_a33c985a59118a0ad56681dcb63"`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" DROP COLUMN "movimiento_origen_id"`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" ADD "movimiento_origen_id" uuid`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN "area_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eca32c4f59a254d2db377a41e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e19acb3538d88af0482188e09"`);
        await queryRunner.query(`DROP TABLE "location_areas"`);
        await queryRunner.query(`DROP TABLE "areas"`);
        await queryRunner.query(`CREATE INDEX "IDX_maintenance_reports_estado" ON "maintenance_reports" ("estado") `);
        await queryRunner.query(`CREATE INDEX "IDX_maintenance_reports_activo_id" ON "maintenance_reports" ("activo_id") `);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" ADD CONSTRAINT "FK_maintenance_reports_activo" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
