import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { MaintenanceReportEntity } from "../../persistence/typeorm/entities/MaintenanceReportEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { MovementEntity } from "../../persistence/typeorm/entities/MovementEntity";
import { TypeORMMaintenanceReportRepository } from "../../persistence/typeorm/repositories/TypeORMMaintenanceReportRepository";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { TypeORMMovementRepository } from "../../persistence/typeorm/repositories/TypeORMMovementRepository";
import { CreateMaintenanceReport } from "../../../application/use-cases/maintenance/CreateMaintenanceReport";
import { UpdateMaintenanceReport } from "../../../application/use-cases/maintenance/UpdateMaintenanceReport";
import { GetActiveMaintenance } from "../../../application/use-cases/maintenance/GetActiveMaintenance";
import { GetMaintenanceHistory } from "../../../application/use-cases/maintenance/GetMaintenanceHistory";
import { MaintenanceController } from "../controllers/MaintenanceController";
import { keycloak } from "../middleware/KeycloakConfig";

const maintenanceRouter = Router();

// Repositorios
const maintenanceRepo = new TypeORMMaintenanceReportRepository(AppDataSource.getRepository(MaintenanceReportEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));

// Casos de uso
const createUC = new CreateMaintenanceReport(maintenanceRepo, activoRepo, movementRepo);
const updateUC = new UpdateMaintenanceReport(maintenanceRepo, activoRepo, movementRepo);
const getActiveUC = new GetActiveMaintenance(maintenanceRepo);
const getHistoryUC = new GetMaintenanceHistory(maintenanceRepo);

// Controlador
const controller = new MaintenanceController(createUC, updateUC, getActiveUC, getHistoryUC);

// Rutas protegidas por Keycloak
maintenanceRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
maintenanceRouter.patch("/:id", keycloak.protect(), (req, res) => controller.update(req, res));
maintenanceRouter.get("/active", keycloak.protect(), (req, res) => controller.getActive(req, res));
maintenanceRouter.get("/history", keycloak.protect(), (req, res) => controller.getHistory(req, res));

export { maintenanceRouter };
