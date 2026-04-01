import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResponsibleLocationsManyToMany1774975086838 implements MigrationInterface {
    name = 'CreateResponsibleLocationsManyToMany1774975086838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla intermedia e índices
        await queryRunner.query(`CREATE TABLE "responsible_locations" ("responsible_id" uuid NOT NULL, "location_id" uuid NOT NULL, CONSTRAINT "PK_fae5f784412d14a81a8c001e272" PRIMARY KEY ("responsible_id", "location_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_52bb1b5d469247e4d530910f58" ON "responsible_locations" ("responsible_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4e3fd3a117d4cfd7c36a9b1fe9" ON "responsible_locations" ("location_id") `);
        
        // 2. MIGRACIÓN DE DATOS: Pasar responsables actuales a la tabla intermedia
        // Convertimos el ID de string a UUID para la inserción
        await queryRunner.query(`
            INSERT INTO "responsible_locations" ("location_id", "responsible_id")
            SELECT "id", "responsibleId"::uuid 
            FROM "locations" 
            WHERE "responsibleId" IS NOT NULL AND "responsibleId" <> ''
        `);

        // 3. Limpiar columna obsoleta
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "responsibleId"`);

        // 4. Agregar campo Rol
        await queryRunner.query(`ALTER TABLE "responsables" ADD "rol" character varying NOT NULL DEFAULT 'EXTERNO'`);

        // 5. Establecer llaves foráneas
        await queryRunner.query(`ALTER TABLE "responsible_locations" ADD CONSTRAINT "FK_52bb1b5d469247e4d530910f580" FOREIGN KEY ("responsible_id") REFERENCES "responsables"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "responsible_locations" ADD CONSTRAINT "FK_4e3fd3a117d4cfd7c36a9b1fe93" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "responsible_locations" DROP CONSTRAINT "FK_4e3fd3a117d4cfd7c36a9b1fe93"`);
        await queryRunner.query(`ALTER TABLE "responsible_locations" DROP CONSTRAINT "FK_52bb1b5d469247e4d530910f580"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN "rol"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "responsibleId" character varying NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e3fd3a117d4cfd7c36a9b1fe9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52bb1b5d469247e4d530910f58"`);
        await queryRunner.query(`DROP TABLE "responsible_locations"`);
    }

}
