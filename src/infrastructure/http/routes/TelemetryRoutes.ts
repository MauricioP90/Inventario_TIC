import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../data-source';
import { ActivoEntity } from '../../persistence/typeorm/entities/ActivoEntity';
import { LocationEntity } from '../../persistence/typeorm/entities/LocationEntity';
import { MovementEntity } from '../../persistence/typeorm/entities/MovementEntity';
import { ActivoTelemetryLogEntity } from '../../persistence/typeorm/entities/ActivoTelemetryLogEntity';
import { ResponsibleEntity } from '../../persistence/typeorm/entities/ResponsibleEntity';
import { TypeORMActivoRepository } from '../../persistence/typeorm/repositories/TypeORMActivoRepository';
import { TypeORMLocationRepository } from '../../persistence/typeorm/repositories/TypeORMLocationRepository';
import { TypeORMMovementRepository } from '../../persistence/typeorm/repositories/TypeORMMovementRepository';
import { TypeORMActivoTelemetryRepository } from '../../persistence/typeorm/repositories/TypeORMActivoTelemetryRepository';
import { TypeORMResponsibleRepository } from '../../persistence/typeorm/repositories/TypeORMResponsibleRepository';
import { RegisterDeviceHeartbeat } from '../../../application/use-cases/telemetry/RegisterDeviceHeartbeat';
import { GetActivoTelemetry } from '../../../application/use-cases/telemetry/GetActivoTelemetry';
import { SendUnauthorizedLocationAlertHandler } from '../../../application/handlers/SendUnauthorizedLocationAlertHandler';
import { InMemoryEventBus } from '../../events/InMemoryEventBus';
import { UnauthorizedLocationDetectedDomainEvent } from '../../../domain/events/UnauthorizedLocationDetectedDomainEvent';
import { EmailServiceFactory } from '../../services/EmailServiceFactory';
import { WasapiNotificationService } from '../../services/WasapiNotificationService';
import { TelemetryController } from '../controllers/TelemetryController';
import { keycloak } from '../middleware/KeycloakConfig';

const telemetryRouter = Router();

const activoRepo = new TypeORMActivoRepository(AppDataSource.getRepository(ActivoEntity));
const locationRepo = new TypeORMLocationRepository(AppDataSource.getRepository(LocationEntity));
const movementRepo = new TypeORMMovementRepository(AppDataSource.getRepository(MovementEntity));
const telemetryRepo = new TypeORMActivoTelemetryRepository(AppDataSource.getRepository(ActivoTelemetryLogEntity));
const responsibleRepo = new TypeORMResponsibleRepository(AppDataSource.getRepository(ResponsibleEntity));

const emailService = EmailServiceFactory.create();
const whatsAppService = new WasapiNotificationService();
const eventBus = new InMemoryEventBus();

const unauthorizedLocationAlertHandler = new SendUnauthorizedLocationAlertHandler(
    emailService,
    telemetryRepo,
    whatsAppService,
    responsibleRepo
);
eventBus.subscribe<UnauthorizedLocationDetectedDomainEvent>(
    'UnauthorizedLocationDetected',
    (event) => unauthorizedLocationAlertHandler.handle(event)
);

const registerHeartbeatUC = new RegisterDeviceHeartbeat(
    activoRepo,
    locationRepo,
    movementRepo,
    telemetryRepo,
    eventBus
);
const getActivoTelemetryUC = new GetActivoTelemetry(telemetryRepo);

const controller = new TelemetryController(registerHeartbeatUC, getActivoTelemetryUC, emailService, whatsAppService, responsibleRepo);

/**
 * Middleware híbrido para el agente de arranque:
 * Permite la autenticación por cabecera X-Device-Api-Key (para el demonio de arranque en POS/PC sin sesión humana)
 * o mediante sesión/token JWT de Keycloak (para simulaciones y pruebas de auditoría desde la UI).
 */
const deviceOrKeycloakAuth = (req: Request, res: Response, next: NextFunction) => {
    const expectedDeviceKey = process.env.DEVICE_TELEMETRY_API_KEY || 'flm-telemetry-secret-key-2026';
    const providedDeviceKey = req.headers['x-device-api-key'];

    if (providedDeviceKey && providedDeviceKey === expectedDeviceKey) {
        return next();
    }

    return keycloak.protect()(req, res, next);
};

telemetryRouter.post('/heartbeat', deviceOrKeycloakAuth, (req, res) => controller.registerHeartbeat(req, res));
telemetryRouter.post('/test-alert', keycloak.protect(), (req, res) => controller.sendTestAlert(req, res));
telemetryRouter.get('/overview', keycloak.protect(), (req, res) => controller.getOverview(req, res));
telemetryRouter.get('/settings', keycloak.protect(), (req, res) => controller.getSettings(req, res));
telemetryRouter.put('/settings', keycloak.protect(), (req, res) => controller.updateSettings(req, res));
telemetryRouter.get('/activos/:activoId', keycloak.protect(), (req, res) => controller.getActivoHistory(req, res));

export { telemetryRouter };

