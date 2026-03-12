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

//3. Inicializamos el controlador
const simCardController = new SIMCardController(createUC, getAllUC, assignUC, updateUC, bajaUC, getOneUC);

//4. Definimos las rutas
simCardRouter.get("/", (req, res) => simCardController.getAll(req, res));
simCardRouter.post("/", (req, res) => simCardController.create(req, res));
simCardRouter.put("/:simCardId/assign", (req, res) => simCardController.assign(req, res));
simCardRouter.get("/:id", (req, res) => simCardController.getOne(req, res));
simCardRouter.put("/:id", (req, res) => simCardController.update(req, res));
simCardRouter.patch("/:id/desactivate", (req, res) => simCardController.desactivate(req, res));

export { simCardRouter };
