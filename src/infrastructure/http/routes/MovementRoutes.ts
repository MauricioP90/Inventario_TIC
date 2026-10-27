import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { MovementEntity } from "../../persistence/typeorm/entities/MovementEntity";
import { ActivoEntity } from "../../persistence/typeorm/entities/ActivoEntity";
import { LocationEntity } from "../../persistence/typeorm/entities/LocationEntity";
import { ResponsibleEntity } from "../../persistence/typeorm/entities/ResponsibleEntity";
import { MaintenanceReportEntity } from "../../persistence/typeorm/entities/MaintenanceReportEntity";
import { RegisterMovement } from "../../../application/use-cases/movement/RegisterMovement";
import { DispatchMovement } from "../../../application/use-cases/movement/DispatchMovement";
import { ReceiveMovement } from "../../../application/use-cases/movement/ReceiveMovement";
import { GetMovements } from "../../../application/use-cases/movement/GetMovements";
import { RejectMovement } from "../../../application/use-cases/movement/RejectMovement";
import { ReceiveByMagicLink } from "../../../application/use-cases/movement/ReceiveByMagicLink";
import { GetMovementByMagicLink } from "../../../application/use-cases/movement/GetMovementByMagicLink";
import { RejectByMagicLink } from "../../../application/use-cases/movement/RejectByMagicLink";
import { UpdateMovementNotes } from "../../../application/use-cases/movement/UpdateMovementNotes";
import { CancelMovement } from "../../../application/use-cases/movement/CancelMovement";
import { AttachMovementDocument } from "../../../application/use-cases/movement/AttachMovementDocument";
import { TypeORMMovementRepository } from "../../persistence/typeorm/repositories/TypeORMMovementRepository";
import { TypeORMActivoRepository } from "../../persistence/typeorm/repositories/TypeORMActivoRepository";
import { TypeORMLocationRepository } from "../../persistence/typeorm/repositories/TypeORMLocationRepository";
import { TypeORMResponsibleRepository } from "../../persistence/typeorm/repositories/TypeORMResponsibleRepository";
import { TypeORMSIMCardRepository } from "../../persistence/typeorm/repositories/TypeORMSIMCardRepository";
import { TypeORMMaintenanceReportRepository } from "../../persistence/typeorm/repositories/TypeORMMaintenanceReportRepository";
import { SIMCardEntity } from "../../persistence/typeorm/entities/SIMCardEntity";
import { EmailServiceFactory } from "../../services/EmailServiceFactory";
import { WasapiNotificationService } from "../../services/WasapiNotificationService";
import { StorageAdapterFactory } from "../../storage/StorageAdapterFactory";
import { MovementController } from "../controllers/MovementController";
import { TypeORMUnitOfWork } from "../../persistence/typeorm/TypeORMUnitOfWork";
import { keycloak } from "../middleware/KeycloakConfig";
import { InMemoryEventBus } from "../../events/InMemoryEventBus";
import { MovementDispatchedDomainEvent, MovementReceivedDomainEvent } from "../../../domain/events";
import { SendMovementDispatchedNotificationHandler } from "../../../application/handlers/SendMovementDispatchedNotificationHandler";
import { SendMovementReceivedNotificationHandler } from "../../../application/handlers/SendMovementReceivedNotificationHandler";

const movementRouter = Router();

// 1. Inicializamos Repositorios y Unidad de Trabajo (ACID)
const unitOfWork = new TypeORMUnitOfWork(AppDataSource);
const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));
const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const responsibleRepo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));
const simCardRepo = new TypeORMSIMCardRepository(AppDataSource.getRepository(SIMCardEntity));
const maintenanceReportRepo = new TypeORMMaintenanceReportRepository(AppDataSource.getRepository(MaintenanceReportEntity));

// Inicializa servicios externos (Correo, WhatsApp y Almacenamiento)
const emailService = EmailServiceFactory.create();
const whatsAppService = new WasapiNotificationService();
const fileStorageService = StorageAdapterFactory.getAdapter();

// 2. Inicializamos Bus de Eventos de Dominio y Suscriptores Desacoplados
const eventBus = new InMemoryEventBus();

const dispatchedNotificationHandler = new SendMovementDispatchedNotificationHandler(
    emailService,
    whatsAppService,
    locationRepo,
    responsibleRepo,
    movementRepo
);
eventBus.subscribe<MovementDispatchedDomainEvent>('MovementDispatched', (event) => dispatchedNotificationHandler.handle(event));

const receivedNotificationHandler = new SendMovementReceivedNotificationHandler(
    emailService,
    locationRepo,
    responsibleRepo
);
eventBus.subscribe<MovementReceivedDomainEvent>('MovementReceived', (event) => receivedNotificationHandler.handle(event));

// 3. Inicializamos Casos de Uso (Blindados con Transaccionalidad Atómica y Event-Driven)
const registerUC = new RegisterMovement(movementRepo, activoRepo, locationRepo, responsibleRepo, emailService, simCardRepo, unitOfWork);
const dispatchUC = new DispatchMovement(movementRepo, activoRepo, eventBus, unitOfWork);
const receiveUC = new ReceiveMovement(movementRepo, activoRepo, simCardRepo, maintenanceReportRepo, responsibleRepo, locationRepo, eventBus, unitOfWork);
const getUC = new GetMovements(movementRepo);
const rejectUC = new RejectMovement(movementRepo, activoRepo, unitOfWork);
const receiveByMagicLinkUC = new ReceiveByMagicLink(movementRepo, activoRepo, simCardRepo, maintenanceReportRepo, responsibleRepo, locationRepo, fileStorageService, unitOfWork);
const getMovementByMagicLinkUC = new GetMovementByMagicLink(movementRepo);
const rejectByMagicLinkUC = new RejectByMagicLink(movementRepo, activoRepo, unitOfWork);
const updateMovementNotesUC = new UpdateMovementNotes(movementRepo);
const cancelUC = new CancelMovement(movementRepo, activoRepo, unitOfWork);
const attachMovementDocumentUC = new AttachMovementDocument(movementRepo);

// 3. Inicializamos Controlador
const controller = new MovementController(
    registerUC, 
    dispatchUC, 
    receiveUC, 
    getUC, 
    rejectUC, 
    receiveByMagicLinkUC, 
    getMovementByMagicLinkUC, 
    rejectByMagicLinkUC, 
    updateMovementNotesUC, 
    cancelUC,
    attachMovementDocumentUC
);

// 4. Definimos Rutas
movementRouter.post("/", keycloak.protect(), (req, res) => controller.register(req, res));
movementRouter.get("/", keycloak.protect(), (req, res) => controller.getAll(req, res));
movementRouter.patch("/:id/dispatch", keycloak.protect(), (req, res) => controller.dispatch(req, res));
movementRouter.patch("/:id/receive", keycloak.protect(), (req, res) => controller.receive(req, res));
movementRouter.patch("/:id/reject", keycloak.protect(), (req, res) => controller.reject(req, res));
movementRouter.patch("/:id/notes", keycloak.protect(), (req, res) => controller.updateNotes(req, res));
movementRouter.patch("/:id/cancel", keycloak.protect(), (req, res) => controller.cancel(req, res));
movementRouter.patch("/:id/documents", keycloak.protect(), (req, res) => controller.attachDocuments(req, res));

// Rutas Públicas (Magic Links) - No requieren Keycloak
movementRouter.get("/public/magic-link/:token", (req, res) => controller.getPublicMovement(req, res));
movementRouter.post("/public/magic-link/:token/receive", (req, res) => controller.publicReceive(req, res));
movementRouter.post("/public/magic-link/:token/reject", (req, res) => controller.publicReject(req, res));

export { movementRouter };
