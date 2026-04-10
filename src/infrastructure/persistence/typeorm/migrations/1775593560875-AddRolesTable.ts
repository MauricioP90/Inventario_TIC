import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRolesTable1775593560875 implements MigrationInterface {
    name = 'AddRolesTable1775593560875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla de roles
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL, "nombre" character varying NOT NULL, "estado" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);

        // 2. Insertar roles iniciales (Usamos UUIDs fijos para la migración)
        const adminId = '7d4b4a6d-88b1-4f0e-9c1a-2b7e9a8d1c01';
        const consultorId = '7d4b4a6d-88b1-4f0e-9c1a-2b7e9a8d1c02';
        const coordinadorId = '7d4b4a6d-88b1-4f0e-9c1a-2b7e9a8d1c03';
        const usuarioId = '7d4b4a6d-88b1-4f0e-9c1a-2b7e9a8d1c04';

        await queryRunner.query(`INSERT INTO "roles" ("id", "nombre", "estado") VALUES 
            ('${adminId}', 'Administrador', 'ACTIVO'),
            ('${consultorId}', 'Consultor', 'ACTIVO'),
            ('${coordinadorId}', 'Coordinador', 'ACTIVO'),
            ('${usuarioId}', 'Usuario', 'ACTIVO')`);

        // 3. Crear columna role_id y relación
        await queryRunner.query(`ALTER TABLE "responsables" ADD "role_id" uuid`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // 4. MIGRACIÓN DE DATOS: Pasamos el texto viejo al nuevo ID
        await queryRunner.query(`UPDATE "responsables" SET "role_id" = '${adminId}' WHERE "rol" = 'ADMIN'`);
        await queryRunner.query(`UPDATE "responsables" SET "role_id" = '${consultorId}' WHERE "rol" = 'CONSULTOR'`);
        await queryRunner.query(`UPDATE "responsables" SET "role_id" = '${coordinadorId}' WHERE "rol" = 'COORDINADOR'`);
        await queryRunner.query(`UPDATE "responsables" SET "role_id" = '${usuarioId}' WHERE "rol" = 'USUARIO'`);

        // Asignamos usuario a cualquiera que haya quedado sin rol
        await queryRunner.query(`UPDATE "responsables" SET "role_id" = '${usuarioId}' WHERE "role_id" IS NULL`);

        // 5. Borrar la columna vieja y hacer que role_id sea obligatorio
        await queryRunner.query(`ALTER TABLE "responsables" ALTER COLUMN "role_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN "rol"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Para volver atrás, tendríamos que recrear la columna 'rol' (pero esto es opcional ahora)
        await queryRunner.query(`ALTER TABLE "responsables" ADD "rol" character varying`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN "role_id"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }


}
