import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNotificationUuidToMovements1782100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "movements",
            new TableColumn({
                name: "notification_uuid",
                type: "text",
                isNullable: true
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("movements", "notification_uuid");
    }
}
