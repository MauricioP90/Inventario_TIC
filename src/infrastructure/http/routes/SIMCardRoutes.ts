import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { GetAllSIMCards } from "../../../application/use-cases/sim-card/GetAllSiMCards";
import { UpdateSIMCard } from "../../../application/use-cases/sim-card/UpdateSIMCard";
import { GetOneSIMCard } from "../../../application/use-cases/sim-card/GetOneSIMCard";
import { CreateSIMCard } from "../../../application/use-cases/sim-card/CreateSIMCard";
import { SIMCardController } from "../controllers/SIMCardController";
import { keycloak } from "../middleware/KeycloakConfig";

const simCardRouter = Router();

// 1. Inicializamos el repositorio de TypeORM
const typeormRepo = AppDataSource.getRepository(SIMCardEntity);
const simRepo = new TypeORMSIMCardRepository(typeormRepo);

// 2. Inicializamos los casos de uso
const createUC = new CreateSIMCard(simRepo);
const getAllUC = new GetAllSIMCards(simRepo);
const getOneUC = new GetOneSIMCard(simRepo);
const updateUC = new UpdateSIMCard(simRepo);

// 3. Inicializamos el controlador
const controller = new SIMCardController(createUC, getAllUC, updateUC, getOneUC);

// 4. Definimos las rutas
simCardRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
simCardRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
simCardRouter.get("/:id", keycloak.protect(), (req, res) => controller.getOne(req, res));
simCardRouter.put("/:id", keycloak.protect(), (req, res) => controller.update(req, res));

export { simCardRouter };
