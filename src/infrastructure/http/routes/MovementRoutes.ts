import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { MovementEntity } from "../../persistence/typeorm/entities/MovementEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { RegisterMovement } from "../../../application/use-cases/movement/RegisterMovement";
import { DispatchMovement } from "../../../application/use-cases/movement/DispatchMovement";
import { ReceiveMovement } from "../../../application/use-cases/movement/ReceiveMovement";
import { GetMovements } from "../../../application/use-cases/movement/GetMovements";
import { RejectMovement } from "../../../application/use-cases/movement/RejectMovement";
import { ReceiveByMagicLink } from "../../../application/use-cases/movement/ReceiveByMagicLink";
import { GetMovementByMagicLink } from "../../../application/use-cases/movement/GetMovementByMagicLink";
import { RejectByMagicLink } from "../../../application/use-cases/movement/RejectByMagicLink";
import { TypeORMMovementRepository } from "../../persistence/typeorm/repositories/TypeORMMovementRepository";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { ConsoleEmailService } from "../../services/ConsoleEmailService";
import { MovementController } from "../controllers/MovementController";
import { keycloak } from "../middleware/KeycloakConfig";

const movementRouter = Router();

// 1. Inicializamos Repositorios
const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const responsibleRepo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));
const simCardRepo = new TypeORMSIMCardRepository(AppDataSource.getRepository(SIMCardEntity));
//Inicializa el servicio de correo nativo
const emailService = new ConsoleEmailService();

// 2. Inicializamos Casos de Uso
const registerUC = new RegisterMovement(movementRepo, activoRepo, locationRepo, responsibleRepo, emailService);
const dispatchUC = new DispatchMovement(movementRepo, activoRepo);
const receiveUC = new ReceiveMovement(movementRepo, activoRepo, simCardRepo);
const getUC = new GetMovements(movementRepo);
const rejectUC = new RejectMovement(movementRepo, activoRepo);
const receiveByMagicLinkUC = new ReceiveByMagicLink(movementRepo, activoRepo, simCardRepo);
const getMovementByMagicLinkUC = new GetMovementByMagicLink(movementRepo);
const rejectByMagicLinkUC = new RejectByMagicLink(movementRepo, activoRepo);

// 3. Inicializamos Controlador
const controller = new MovementController(registerUC, dispatchUC, receiveUC, getUC, rejectUC, receiveByMagicLinkUC, getMovementByMagicLinkUC, rejectByMagicLinkUC);

// 4. Definimos Rutas
movementRouter.post("/", keycloak.protect(), (req, res) => controller.register(req, res));
movementRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
movementRouter.patch("/:id/dispatch", keycloak.protect(), (req, res) => controller.dispatch(req, res));
movementRouter.patch("/:id/receive", keycloak.protect(), (req, res) => controller.receive(req, res));
movementRouter.patch("/:id/reject", keycloak.protect(), (req, res) => controller.reject(req, res));

// Rutas Públicas (Magic Links) - No requieren Keycloak
movementRouter.get("/public/magic-link/:token", (req, res) => controller.getPublicMovement(req, res));
movementRouter.post("/public/magic-link/:token/receive", (req, res) => controller.publicReceive(req, res));
movementRouter.post("/public/magic-link/:token/reject", (req, res) => controller.publicReject(req, res));

export { movementRouter };
