import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEventosToNotificationRecipients1782300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "notification_recipients",
            new TableColumn({
                name: "eventos",
                type: "text",
                isNullable: false,
                default: "'DESPACHO_TRASLADO,RECEPCION_TRASLADO'"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("notification_recipients", "eventos");
    }
}
