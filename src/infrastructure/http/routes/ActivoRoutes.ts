import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { ActivoController } from "../controllers/ActivoController";
import { keycloak } from "../middleware/KeycloakConfig";

// Entidades y Repositorios
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { TipoActivoEntity } from "../../persistence/typeorm/entities/TipoActivoEntity";
import { TypeORMTipoActivoRepository } from "../../persistence/typeorm/repositories/TypeORMTipoActivoRepository";
import { MovementEntity } from "../../persistence/typeorm/entities/MovementEntity";
import { TypeORMMovementRepository } from "../../persistence/typeorm/repositories/TypeORMMovementRepository";
import { MaintenanceReportEntity } from "../../persistence/typeorm/entities/MaintenanceReportEntity";
import { TypeORMMaintenanceReportRepository } from "../../persistence/typeorm/repositories/TypeORMMaintenanceReportRepository";

// Casos de Uso
import { CreateActivo } from "../../../application/use-cases/activo/CreateActivo";
import { GetAllActivo } from "../../../application/use-cases/activo/GetAllActivo";
import { GetOneActivo } from "../../../application/use-cases/activo/GetOneActivo";
import { UpdateActivo } from "../../../application/use-cases/activo/UpdateActivo";
import { DarDeBajaActivo } from "../../../application/use-cases/activo/DarDeBajaActivo";
import { GetActivoMetadata } from "../../../application/use-cases/activo/GetActivoMetadata";
import { FindByIdActivo } from "../../../application/use-cases/activo/FindByActivo";
import { GetDashboardSummary } from "../../../application/use-cases/activo/GetDashboardSummary";
import { CreateTipoActivo } from "../../../application/use-cases/tipoActivo/CreateTipoActivo";
import { GetAllTipoActivo } from "../../../application/use-cases/tipoActivo/GetAllTipoActivo";
import { UpdateTipoActivo } from "../../../application/use-cases/tipoActivo/UpdateTipoActivo";

const activoRouter = Router();

// 1. Inicializamos Repositorios
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const responsibleRepo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));
const simCardRepo = new TypeORMSIMCardRepository(AppDataSource.getRepository(SIMCardEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const tipoActivoRepo = new TypeORMTipoActivoRepository(AppDataSource.getRepository(TipoActivoEntity));
const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));
const maintenanceRepo = new TypeORMMaintenanceReportRepository(AppDataSource.getRepository(MaintenanceReportEntity));

// 2. Inicializamos Casos de Uso
const createUC = new CreateActivo(activoRepo, locationRepo, responsibleRepo);
const getAllUC = new GetAllActivo(activoRepo);
const getOneUC = new GetOneActivo(activoRepo);
const updateUC = new UpdateActivo(activoRepo, locationRepo, responsibleRepo, movementRepo, maintenanceRepo);
const darDeBajaUC = new DarDeBajaActivo(activoRepo);
const getMetadataUC = new GetActivoMetadata(tipoActivoRepo, locationRepo);
const findByIdUC = new FindByIdActivo(activoRepo);
const getDashboardSummaryUC = new GetDashboardSummary(activoRepo);
const createTipoActivoUC = new CreateTipoActivo(tipoActivoRepo);
const getAllTipoActivoUC = new GetAllTipoActivo(tipoActivoRepo);
const updateTipoActivoUC = new UpdateTipoActivo(tipoActivoRepo);

const controller = new ActivoController(
    createUC, 
    getAllUC, 
    getOneUC, 
    updateUC, 
    darDeBajaUC, 
    getMetadataUC, 
    findByIdUC, 
    getDashboardSummaryUC,
    createTipoActivoUC,
    getAllTipoActivoUC,
    updateTipoActivoUC
);

// 4. Definimos Rutas
activoRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
activoRouter.post("/types", keycloak.protect(), (req, res) => controller.createTipoActivo(req, res));
activoRouter.get("/types", keycloak.protect(), (req, res) => controller.getAllTipoActivo(req, res));
activoRouter.put("/types/:id", keycloak.protect(), (req, res) => controller.updateTipoActivo(req, res));
activoRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
activoRouter.get("/metadata", keycloak.protect(), (req, res) => controller.getActivoMetadata(req, res));
activoRouter.get("/dashboard", keycloak.protect(), (req, res) => controller.getDashboardSummary(req, res));
activoRouter.get("/:id/audit-history", keycloak.protect(), (req, res) => controller.getAuditHistory(req, res));
activoRouter.get("/:placa", keycloak.protect(), (req, res) => controller.getOne(req, res));
activoRouter.put("/:placa", keycloak.protect(), (req, res) => controller.update(req, res));
activoRouter.patch("/:placa/baja", keycloak.protect(), (req, res) => controller.darDeBaja(req, res));

export { activoRouter };
