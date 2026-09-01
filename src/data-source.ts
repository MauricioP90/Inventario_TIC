import "reflect-metadata";
import { DataSource } from "typeorm";
import { ActivoEntity } from "./infrastructure/persistence/typeorm/entities/ActivoEntity";
import { SIMCardEntity } from "./infrastructure/persistence/typeorm/entities/SIMCardEntity";
import { ResponsibleEntity } from "./infrastructure/persistence/typeorm/entities/ResponsibleEntity";
import { LocationEntity } from "./infrastructure/persistence/typeorm/entities/LocationEntity";
import { RoleEntity } from "./infrastructure/persistence/typeorm/entities/RoleEntity";
import { MovementEntity } from "./infrastructure/persistence/typeorm/entities/MovementEntity";
import { TipoActivoEntity } from "./infrastructure/persistence/typeorm/entities/TipoActivoEntity";
import { MaintenanceReportEntity } from "./infrastructure/persistence/typeorm/entities/MaintenanceReportEntity";
import { AreaEntity } from "./infrastructure/persistence/typeorm/entities/AreaEntity";
import { ActivoDocumentHistoryEntity } from "./infrastructure/persistence/typeorm/entities/ActivoDocumentHistoryEntity";
import { NotificationRecipientEntity } from "./infrastructure/persistence/typeorm/entities/NotificationRecipientEntity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "127.0.0.1",
    port: 5433,
    username: "admin",
    password: "admin123",
    database: "inventario",
    synchronize: false,
    logging: true,
    entities: [
        ActivoEntity, 
        SIMCardEntity, 
        ResponsibleEntity, 
        LocationEntity, 
        RoleEntity, 
        MovementEntity, 
        TipoActivoEntity, 
        MaintenanceReportEntity, 
        AreaEntity,
        ActivoDocumentHistoryEntity,
        NotificationRecipientEntity
    ],
    migrations: ["src/infrastructure/persistence/typeorm/migrations/*.ts"],
    subscribers: [],
});
