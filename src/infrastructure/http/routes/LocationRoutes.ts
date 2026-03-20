import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { LocationController } from "../controllers/LocationController";
import { CreateLocation } from "../../../application/use-cases/location/createLocation";
import { GetAllLocations } from "../../../application/use-cases/location/GetAllLocations";
import { UpdateLocation } from "../../../application/use-cases/location/updateLocation";
import { GetOneLocation } from "../../../application/use-cases/location/GetOneLocation";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";


const LocationRouter = Router();

//1. Inicializamos el repositorio de TypeORM
const typeormRepo = AppDataSource.getRepository(LocationEntity);
const locationRepo = new TypeORMLocationRepository(typeormRepo);

//2. Necesitamos el repositorio de responsables
const typeormResponsibleRepo = AppDataSource.getRepository(ResponsibleEntity);
const responsibleRepo = new TypeORMResponsibleRepository(typeormResponsibleRepo);

//3. Inicializamos los casos de uso

const createLocationUC = new CreateLocation(locationRepo, responsibleRepo);
const getAllLocationsUC = new GetAllLocations(locationRepo);
const updateLocationUC = new UpdateLocation(locationRepo, responsibleRepo);
const getOneLocationUC = new GetOneLocation(locationRepo);

//4. Inicializamos el controlador
const locationController = new LocationController(createLocationUC, getAllLocationsUC, updateLocationUC, getOneLocationUC);

//5. definimos las rutas
LocationRouter.post("/", (req, res) => locationController.create(req, res));
LocationRouter.get("/", (req, res) => locationController.getAll(req, res));
LocationRouter.get("/:code", (req, res) => locationController.getOne(req, res));
LocationRouter.put("/:code", (req, res) => locationController.update(req, res));

export { LocationRouter };