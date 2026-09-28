import { MigrationInterface, QueryRunner } from "typeorm";

export class DropRolesTableAndRemoveRoleIdFromResponsables1782400000000 implements MigrationInterface {
    name = 'DropRolesTableAndRemoveRoleIdFromResponsables1782400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "responsables" DROP CONSTRAINT IF EXISTS "FK_3e139c8e888b43ab5ac5d2b94ce"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN IF EXISTS "role_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "roles" ("id" uuid NOT NULL, "nombre" character varying NOT NULL, "estado" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD "role_id" uuid`);
        await queryRunner.query(`ALTER TABLE "responsables" ADD CONSTRAINT "FK_3e139c8e888b43ab5ac5d2b94ce" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
