import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { RoleEntity } from "../../persistence/typeorm/entities/RoleEntity";
import { CreateResponsible } from "../../../application/use-cases/responsible/CreateResponsible";
import { GetAllResponsible } from "../../../application/use-cases/responsible/GetAllResponsible";
import { GetOneResponsible } from "../../../application/use-cases/responsible/GetOneResponsible";
import { UpdateResponsible } from "../../../application/use-cases/responsible/UpdateResponsible";
import { InactiveResponsible } from "../../../application/use-cases/responsible/InactiveResponsible";
import { GetResponsibleStats } from "../../../application/use-cases/responsible/GetResponsibleStats";
import { GetAllRoles } from "../../../application/use-cases/role/GetAllRoles";
import { CreateRole } from "../../../application/use-cases/role/CreateRole";
import { UpdateRole } from "../../../application/use-cases/role/UpdateRole";
import { InactiveRole } from "../../../application/use-cases/role/InactiveRole";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { ResponsibleController } from "../controllers/ResponsibleController";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { TypeORMRoleRepository } from "../../persistence/typeorm/repositories/TypeORMRoleRepository";

const responsibleRouter = Router();

// 1. Inicializamos Repositorio
const repo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const simCardRepo = new TypeORMSIMCardRepository(AppDataSource.getRepository(SIMCardEntity));
const roleRepo = new TypeORMRoleRepository(AppDataSource.getRepository(RoleEntity));

// 2. Inicializamos Casos de Uso
const createUC = new CreateResponsible(repo, roleRepo);
const getAllUC = new GetAllResponsible(repo);
const getOneUC = new GetOneResponsible(repo);
const updateUC = new UpdateResponsible(repo, roleRepo);
const inactiveUC = new InactiveResponsible(repo, activoRepo, locationRepo);
const getResponsibleStatsUC = new GetResponsibleStats(activoRepo, simCardRepo);
const getAllRolesUC = new GetAllRoles(roleRepo);
const createRoleUC = new CreateRole(roleRepo);
const updateRoleUC = new UpdateRole(roleRepo);
const inactiveRoleUC = new InactiveRole(roleRepo);

import { keycloak } from "../middleware/KeycloakConfig";

// 3. Inicializamos Controlador
const controller = new ResponsibleController(createUC, getAllUC, getOneUC, updateUC, inactiveUC, getResponsibleStatsUC, getAllRolesUC, createRoleUC, updateRoleUC, inactiveRoleUC);

// 4. Definimos Rutas
responsibleRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
responsibleRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
responsibleRouter.get("/roles", keycloak.protect(), (req, res) => controller.getRoles(req, res));
responsibleRouter.post("/roles", keycloak.protect(), (req, res) => controller.createRole(req, res));
responsibleRouter.put("/roles/:id", keycloak.protect(), (req, res) => controller.updateRole(req, res));
responsibleRouter.patch("/roles/:id/inactive", keycloak.protect(), (req, res) => controller.inactiveRole(req, res));
responsibleRouter.get("/:id", keycloak.protect(), (req, res) => controller.getOne(req, res));
responsibleRouter.put("/:id", keycloak.protect(), (req, res) => controller.update(req, res));
responsibleRouter.patch("/:id/inactive", keycloak.protect(), (req, res) => controller.inactive(req, res));
responsibleRouter.get("/:id/stats", keycloak.protect(), (req, res) => controller.getStats(req, res));

export { responsibleRouter };
