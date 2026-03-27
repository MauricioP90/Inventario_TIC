import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorLocationCoordinates1774628922417 implements MigrationInterface {
    name = 'RefactorLocationCoordinates1774628922417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "direccion"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "coordenadas" character varying`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "UQ_1c65ef243169e51b514c814eeae" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "responsableId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "responsableId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "UQ_1c65ef243169e51b514c814eeae"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "coordenadas"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "direccion" character varying NOT NULL`);
    }

}
