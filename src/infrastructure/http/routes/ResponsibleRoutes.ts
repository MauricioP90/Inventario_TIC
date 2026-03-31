import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { CreateResponsible } from "../../../application/use-cases/responsible/CreateResponsible";
import { GetAllResponsible } from "../../../application/use-cases/responsible/GetAllResponsible";
import { GetOneResponsible } from "../../../application/use-cases/responsible/GetOneResponsible";
import { UpdateResponsible } from "../../../application/use-cases/responsible/UpdateResponsible";
import { InactiveResponsible } from "../../../application/use-cases/responsible/InactiveResponsible";
import { ResponsibleController } from "../controllers/ResponsibleController";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { GetResponsibleStats } from "../../../application/use-cases/responsible/GetResponsibleStats";

const responsibleRouter = Router();

// 1. Inicializamos Repositorio
const repo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const simCardRepo = new TypeORMSIMCardRepository(AppDataSource.getRepository(SIMCardEntity));

// 2. Inicializamos Casos de Uso
const createUC = new CreateResponsible(repo);
const getAllUC = new GetAllResponsible(repo);
const getOneUC = new GetOneResponsible(repo);
const updateUC = new UpdateResponsible(repo);
const inactiveUC = new InactiveResponsible(repo, activoRepo, locationRepo);
const getResponsibleStatsUC = new GetResponsibleStats(activoRepo, simCardRepo);

import { keycloak } from "../middleware/KeycloakConfig";

// 3. Inicializamos Controlador
const controller = new ResponsibleController(createUC, getAllUC, getOneUC, updateUC, inactiveUC, getResponsibleStatsUC);

// 4. Definimos Rutas
responsibleRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
responsibleRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
responsibleRouter.get("/:id", keycloak.protect(), (req, res) => controller.getOne(req, res));
responsibleRouter.put("/:id", keycloak.protect(), (req, res) => controller.update(req, res));
responsibleRouter.patch("/:id/inactive", keycloak.protect(), (req, res) => controller.inactive(req, res));
responsibleRouter.get("/:id/stats", keycloak.protect(), (req, res) => controller.getStats(req, res));

export { responsibleRouter };
