import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationObservaciones1781095546353 implements MigrationInterface {
    name = 'AddLocationObservaciones1781095546353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sim_cards" DROP CONSTRAINT "sim_cards_location_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" DROP CONSTRAINT "fk_movement_sim_cards_movement"`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" DROP CONSTRAINT "fk_movement_sim_cards_sim"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "observaciones" text`);
        await queryRunner.query(`CREATE INDEX "IDX_df75afd5abf96591cd01f56bf1" ON "movement_sim_cards" ("movement_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ecbad61ed31202e9ddd4f9b21f" ON "movement_sim_cards" ("sim_card_id") `);
        await queryRunner.query(`ALTER TABLE "sim_cards" ADD CONSTRAINT "FK_764b0ccd519a566f9d76928ac4f" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" ADD CONSTRAINT "FK_df75afd5abf96591cd01f56bf14" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" ADD CONSTRAINT "FK_ecbad61ed31202e9ddd4f9b21fb" FOREIGN KEY ("sim_card_id") REFERENCES "sim_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" DROP CONSTRAINT "FK_ecbad61ed31202e9ddd4f9b21fb"`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" DROP CONSTRAINT "FK_df75afd5abf96591cd01f56bf14"`);
        await queryRunner.query(`ALTER TABLE "sim_cards" DROP CONSTRAINT "FK_764b0ccd519a566f9d76928ac4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ecbad61ed31202e9ddd4f9b21f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df75afd5abf96591cd01f56bf1"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "observaciones"`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" ADD CONSTRAINT "fk_movement_sim_cards_sim" FOREIGN KEY ("sim_card_id") REFERENCES "sim_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movement_sim_cards" ADD CONSTRAINT "fk_movement_sim_cards_movement" FOREIGN KEY ("movement_id") REFERENCES "movements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sim_cards" ADD CONSTRAINT "sim_cards_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
