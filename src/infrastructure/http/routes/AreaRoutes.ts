import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { AreaController } from "../controllers/AreaController";
import { keycloak } from "../middleware/KeycloakConfig";
import { CreateArea } from "../../../application/use-cases/area/CreateArea";
import { GetAllAreas } from "../../../application/use-cases/area/GetAllAreas";
import { UpdateArea } from "../../../application/use-cases/area/UpdateArea";
import { GetOneArea } from "../../../application/use-cases/area/GetOneArea";
import { InactiveArea } from "../../../application/use-cases/area/InactiveArea";
import { AreaEntity } from "../../persistence/typeorm/entities/AreaEntity";
import { TypeORMAreaRepository } from "../../persistence/typeorm/repositories/TypeORMAreaRepository";

const AreaRouter = Router();

const typeormRepo = AppDataSource.getRepository(AreaEntity);
const areaRepo = new TypeORMAreaRepository(typeormRepo);

const createAreaUC = new CreateArea(areaRepo);
const getAllAreasUC = new GetAllAreas(areaRepo);
const updateAreaUC = new UpdateArea(areaRepo);
const getOneAreaUC = new GetOneArea(areaRepo);
const inactiveAreaUC = new InactiveArea(areaRepo);

const areaController = new AreaController(
    createAreaUC,
    getAllAreasUC,
    updateAreaUC,
    getOneAreaUC,
    inactiveAreaUC
);

AreaRouter.post("/", keycloak.protect(), (req, res) => areaController.create(req, res));
AreaRouter.get("/", keycloak.protect(), (req, res) => areaController.getAll(req, res));
AreaRouter.get("/:id", keycloak.protect(), (req, res) => areaController.getOne(req, res));
AreaRouter.put("/:id", keycloak.protect(), (req, res) => areaController.update(req, res));
AreaRouter.patch("/:id/inactive", keycloak.protect(), (req, res) => areaController.inactive(req, res));

export { AreaRouter };
