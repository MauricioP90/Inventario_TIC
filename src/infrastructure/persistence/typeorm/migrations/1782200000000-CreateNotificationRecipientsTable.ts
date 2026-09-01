import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateNotificationRecipientsTable1782200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "notification_recipients",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "nombre",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "area",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "tipo_copia",
                        type: "varchar",
                        length: "10",
                        default: "'CC'"
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("notification_recipients");
    }
}
