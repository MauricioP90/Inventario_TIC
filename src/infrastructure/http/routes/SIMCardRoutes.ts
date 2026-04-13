import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { GetAllSIMCards } from "../../../application/use-cases/sim-card/GetAllSiMCards";
import { UpdateSIMCard } from "../../../application/use-cases/sim-card/UpdateSIMCard";
import { GetOneSIMCard } from "../../../application/use-cases/sim-card/GetOneSIMCard";
import { CreateSIMCard } from "../../../application/use-cases/sim-card/CreateSIMCard";
import { AssignSIMToActivo } from "../../../application/use-cases/sim-card/AssignSIMToActivo";
import { GetSIMByNumero } from "../../../application/use-cases/sim-card/GetSIMByNumero";
import { GetSIMByIccid } from "../../../application/use-cases/sim-card/GetSimByIccid";
import { GetSIMCountByResponsible } from "../../../application/use-cases/sim-card/GetSIMCountByResponsible";
import { DarDeBajaSIM } from "../../../application/use-cases/sim-card/DarDeBajaSIM";
import { SIMCardController } from "../controllers/SIMCardController";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";






// Importa tus casos de uso y el controlador...
const simCardRouter = Router();

//1. Inicializamos el repositorio de TypeORM
const typeormRepo = AppDataSource.getRepository(SIMCardEntity);
const simRepo = new TypeORMSIMCardRepository(typeormRepo);

// NECESITAREMOS TAMBIÉN EL DE ACTIVOS para la asignación
const typeormActivoRepo = AppDataSource.getRepository(ActivoEntity);
const activoRepo = new TypeORMActivoRepository(typeormActivoRepo);

//2. Inicializamos los casos de uso

const createUC = new CreateSIMCard(simRepo); //ya lo cree
const assignUC = new AssignSIMToActivo(simRepo, activoRepo);  //ya lo cree
const getAllUC = new GetAllSIMCards(simRepo); //ya lo cree
const getOneUC = new GetOneSIMCard(simRepo);
const updateUC = new UpdateSIMCard(simRepo);//ya lo cree
const bajaUC = new DarDeBajaSIM(simRepo);//ya lo cree
const getSIMByNumero = new GetSIMByNumero(simRepo);
const getSIMByIccid = new GetSIMByIccid(simRepo);
const getSIMCountByResponsible = new GetSIMCountByResponsible(simRepo);

import { keycloak } from "../middleware/KeycloakConfig";

// 3. Inicializamos el controlador
const controller = new SIMCardController(createUC, getAllUC, assignUC, updateUC, bajaUC, getOneUC, getSIMByNumero, getSIMByIccid, getSIMCountByResponsible);

// 4. Definimos las rutas
simCardRouter.post("/", keycloak.protect(), (req, res) => controller.create(req, res));
simCardRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
simCardRouter.get("/:id", keycloak.protect(), (req, res) => controller.getOne(req, res));
simCardRouter.put("/:id", keycloak.protect(), (req, res) => controller.update(req, res));
simCardRouter.post("/assign", keycloak.protect(), (req, res) => controller.assign(req, res));
simCardRouter.patch("/:id/desactivate", keycloak.protect(), (req, res) => controller.desactivate(req, res));
simCardRouter.get("/numero/:numero", keycloak.protect(), (req, res) => controller.getSIMByNumero(req, res));
simCardRouter.get("/iccid/:iccid", keycloak.protect(), (req, res) => controller.getSIMByIccid(req, res));
simCardRouter.get("/count/responsible/:responsibleId", keycloak.protect(), (req, res) => controller.getSIMCountByResponsible(req, res));

export { simCardRouter };
