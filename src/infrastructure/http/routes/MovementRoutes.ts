import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { MovementEntity } from "../../persistence/typeorm/entities/MovementEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { RegisterMovement } from "../../../application/use-cases/movement/RegisterMovement";
import { DispatchMovement } from "../../../application/use-cases/movement/DispatchMovement";
import { ReceiveMovement } from "../../../application/use-cases/movement/ReceiveMovement";
import { GetMovements } from "../../../application/use-cases/movement/GetMovements";
import { TypeORMMovementRepository } from "../../persistence/typeorm/repositories/TypeORMMovementRepository";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { MovementController } from "../controllers/MovementController";
import { keycloak } from "../middleware/KeycloakConfig";

const movementRouter = Router();

// 1. Inicializamos Repositorios
const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));

// 2. Inicializamos Casos de Uso
const registerUC = new RegisterMovement(movementRepo);
const dispatchUC = new DispatchMovement(movementRepo, activoRepo);
const receiveUC = new ReceiveMovement(movementRepo, activoRepo);
const getUC = new GetMovements(movementRepo);

// 3. Inicializamos Controlador
const controller = new MovementController(registerUC, dispatchUC, receiveUC, getUC);

// 4. Definimos Rutas
movementRouter.post("/", keycloak.protect(), (req, res) => controller.register(req, res));
movementRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
movementRouter.patch("/:id/dispatch", keycloak.protect(), (req, res) => controller.dispatch(req, res));
movementRouter.patch("/:id/receive", keycloak.protect(), (req, res) => controller.receive(req, res));

export { movementRouter };
