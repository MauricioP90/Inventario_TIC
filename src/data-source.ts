import "reflect-metadata";
import { DataSource } from "typeorm";
import { ActivoEntity } from "./infrastructure/persistence/typeorm/entities/ActivoEntity";
import { SIMCardEntity } from "./infrastructure/persistence/typeorm/entities/SIMCardEntity";
import { ResponsibleEntity } from "./infrastructure/persistence/typeorm/entities/ResponsibleEntity";
import { LocationEntity } from "./infrastructure/persistence/typeorm/entities/LocationEntity";
import { RoleEntity } from "./infrastructure/persistence/typeorm/entities/RoleEntity";
import { MovementEntity } from "./infrastructure/persistence/typeorm/entities/MovementEntity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "127.0.0.1",
    port: 5433,
    username: "admin",
    password: "admin123",
    database: "inventario",
    synchronize: false,
    logging: true,
    entities: [ActivoEntity, SIMCardEntity, ResponsibleEntity, LocationEntity, RoleEntity, MovementEntity],
    migrations: ["src/infrastructure/persistence/typeorm/migrations/*.ts"],
    subscribers: [],
});
