import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { LocationController } from "../controllers/LocationController";
import { keycloak } from "../middleware/KeycloakConfig";
import { CreateLocation } from "../../../application/use-cases/location/createLocation";
import { GetAllLocations } from "../../../application/use-cases/location/GetAllLocations";
import { UpdateLocation } from "../../../application/use-cases/location/updateLocation";
import { GetOneLocation } from "../../../application/use-cases/location/GetOneLocation";
import { ReverseGeocode } from "../../../application/use-cases/location/ReverseGeocode";
import { NominatimGeocodingService } from "../../services/NominatimGeocodingService";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { AreaEntity } from "../../persistence/typeorm/entities/AreaEntity";
import { TypeORMAreaRepository } from "../../persistence/typeorm/repositories/TypeORMAreaRepository";


const LocationRouter = Router();

//1. Inicializamos el repositorio de TypeORM
const typeormRepo = AppDataSource.getRepository(LocationEntity);
const locationRepo = new TypeORMLocationRepository(typeormRepo);

//2. Necesitamos el repositorio de responsables
const typeormResponsibleRepo = AppDataSource.getRepository(ResponsibleEntity);
const responsibleRepo = new TypeORMResponsibleRepository(typeormResponsibleRepo);

//3. Necesitamos el repositorio de áreas
const typeormAreaRepo = AppDataSource.getRepository(AreaEntity);
const areaRepo = new TypeORMAreaRepository(typeormAreaRepo);

//4. Inicializamos los casos de uso

const createLocationUC = new CreateLocation(locationRepo, responsibleRepo, areaRepo);
const getAllLocationsUC = new GetAllLocations(locationRepo);
const updateLocationUC = new UpdateLocation(locationRepo, responsibleRepo, areaRepo);
const getOneLocationUC = new GetOneLocation(locationRepo);
const geocodingService = new NominatimGeocodingService();
const reverseGeocodeUC = new ReverseGeocode(geocodingService);

//5. Inicializamos el controlador
const locationController = new LocationController(
    createLocationUC,
    getAllLocationsUC,
    updateLocationUC,
    getOneLocationUC,
    reverseGeocodeUC
);

//5. definimos las rutas
LocationRouter.post("/", keycloak.protect(), (req, res) => locationController.create(req, res));
LocationRouter.get("/", keycloak.protect(), (req, res) => locationController.getAll(req, res));
LocationRouter.get("/reverse-geocode", keycloak.protect(), (req, res) => locationController.reverseGeocode(req, res));
LocationRouter.get("/:code", keycloak.protect(), (req, res) => locationController.getOne(req, res));
LocationRouter.put("/:code", keycloak.protect(), (req, res) => locationController.update(req, res));

export { LocationRouter };