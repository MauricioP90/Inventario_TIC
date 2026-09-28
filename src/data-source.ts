import * as dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import { DataSource } from "typeorm";
import { ActivoEntity } from "./infrastructure/persistence/typeorm/entities/ActivoEntity";
import { SIMCardEntity } from "./infrastructure/persistence/typeorm/entities/SIMCardEntity";
import { ResponsibleEntity } from "./infrastructure/persistence/typeorm/entities/ResponsibleEntity";
import { LocationEntity } from "./infrastructure/persistence/typeorm/entities/LocationEntity";
import { MovementEntity } from "./infrastructure/persistence/typeorm/entities/MovementEntity";
import { TipoActivoEntity } from "./infrastructure/persistence/typeorm/entities/TipoActivoEntity";
import { MaintenanceReportEntity } from "./infrastructure/persistence/typeorm/entities/MaintenanceReportEntity";
import { AreaEntity } from "./infrastructure/persistence/typeorm/entities/AreaEntity";
import { ActivoDocumentHistoryEntity } from "./infrastructure/persistence/typeorm/entities/ActivoDocumentHistoryEntity";
import { NotificationRecipientEntity } from "./infrastructure/persistence/typeorm/entities/NotificationRecipientEntity";
import { CargoEntity } from "./infrastructure/persistence/typeorm/entities/CargoEntity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5433,
    username: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "admin123",
    database: process.env.DB_NAME || "inventario",
    synchronize: false,
    logging: process.env.NODE_ENV === "production" ? (process.env.DB_LOGGING === "true") : true,
    entities: [
        ActivoEntity, 
        SIMCardEntity, 
        ResponsibleEntity, 
        LocationEntity, 
        MovementEntity, 
        TipoActivoEntity, 
        MaintenanceReportEntity, 
        AreaEntity,
        ActivoDocumentHistoryEntity,
        NotificationRecipientEntity,
        CargoEntity
    ],
    migrations: [
        process.env.NODE_ENV === "production"
            ? "dist/infrastructure/persistence/typeorm/migrations/*.js"
            : "src/infrastructure/persistence/typeorm/migrations/*.ts"
    ],
    subscribers: [],
});
