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

// Casos de Uso
import { CreateActivo } from "../../../application/use-cases/activo/CreateActivo";
import { GetAllActivo } from "../../../application/use-cases/activo/GetAllActivo";
import { GetOneActivo } from "../../../application/use-cases/activo/GetOneActivo";
import { UpdateActivo } from "../../../application/use-cases/activo/UpdateActivo";
import { DarDeBajaActivo } from "../../../application/use-cases/activo/DarDeBajaActivo";
import { AssingSIMToActivo } from "../../../application/use-cases/activo/AssingSIMToActivo";

const activoRouter = Router();

// 1. Inicializamos Repositorios
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const responsibleRepo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));
const simCardRepo = new TypeORMSIMCardRepository(AppDataSource.getRepository(SIMCardEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));

// 2. Inicializamos Casos de Uso
const createUC = new CreateActivo(activoRepo, locationRepo, responsibleRepo);
const getAllUC = new GetAllActivo(activoRepo);
const getOneUC = new GetOneActivo(activoRepo);
const updateUC = new UpdateActivo(activoRepo, locationRepo, responsibleRepo);
const darDeBajaUC = new DarDeBajaActivo(activoRepo);
const assignSIMUC = new AssingSIMToActivo(activoRepo, simCardRepo);

// 3. Inicializamos Controlador
const controller = new ActivoController(createUC, getAllUC, getOneUC, updateUC, darDeBajaUC, assignSIMUC);

// 4. Definimos Rutas
activoRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
activoRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
activoRouter.get("/:placa", keycloak.protect(), (req, res) => controller.getOne(req, res));
activoRouter.put("/:placa", keycloak.protect(), (req, res) => controller.update(req, res));
activoRouter.patch("/:placa/baja", keycloak.protect(), (req, res) => controller.darDeBaja(req, res));
activoRouter.post("/:placa/sim", keycloak.protect(), (req, res) => controller.assignSIM(req, res));

export { activoRouter };
