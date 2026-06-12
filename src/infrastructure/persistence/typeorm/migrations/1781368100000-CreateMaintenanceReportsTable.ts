import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMaintenanceReportsTable1781368100000 implements MigrationInterface {
    name = 'CreateMaintenanceReportsTable1781368100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "maintenance_reports" (
                "id" uuid NOT NULL,
                "activo_id" uuid NOT NULL,
                "modalidad" character varying NOT NULL DEFAULT 'INTERNO',
                "tipo_mantenimiento" character varying NOT NULL DEFAULT 'CORRECTIVO',
                "estado" character varying NOT NULL DEFAULT 'PENDIENTE_DIAGNOSTICO',
                "diagnostico" text,
                "acciones_realizadas" text,
                "repuestos_usados" text,
                "costo_estimado" DECIMAL(12,2),
                "costo_final" DECIMAL(12,2),
                "cubierto_por_garantia" boolean NOT NULL DEFAULT false,
                "tecnico_responsable" character varying,
                "escala_a_proveedor" boolean NOT NULL DEFAULT false,
                "motivo_escalacion" text,
                "fecha_escalacion" TIMESTAMP,
                "proveedor_servicio" character varying,
                "referencia_orden_servicio" character varying,
                "soporte_proveedor_url" character varying,
                "soporte_autorizacion_url" character varying,
                "resultado_final" character varying,
                "movimiento_origen_id" uuid,
                "fecha_apertura" TIMESTAMP NOT NULL DEFAULT now(),
                "fecha_inicio_interno" TIMESTAMP,
                "fecha_diagnostico" TIMESTAMP,
                "fecha_envio_proveedor" TIMESTAMP,
                "fecha_retorno_proveedor" TIMESTAMP,
                "fecha_cierre" TIMESTAMP,
                CONSTRAINT "PK_maintenance_reports" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "maintenance_reports"
            ADD CONSTRAINT "FK_maintenance_reports_activo"
            FOREIGN KEY ("activo_id") REFERENCES "activos"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`CREATE INDEX "IDX_maintenance_reports_activo_id" ON "maintenance_reports" ("activo_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_maintenance_reports_estado" ON "maintenance_reports" ("estado")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_maintenance_reports_estado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_maintenance_reports_activo_id"`);
        await queryRunner.query(`ALTER TABLE "maintenance_reports" DROP CONSTRAINT "FK_maintenance_reports_activo"`);
        await queryRunner.query(`DROP TABLE "maintenance_reports"`);
    }
}
