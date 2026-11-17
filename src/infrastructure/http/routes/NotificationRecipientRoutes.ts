import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { NotificationRecipientEntity } from "../../persistence/typeorm/entities/NotificationRecipientEntity";
import { TypeORMNotificationRecipientRepository } from "../../persistence/typeorm/repositories/TypeORMNotificationRecipientRepository";
import { GetNotificationRecipients } from "../../../application/use-cases/notification-recipient/GetNotificationRecipients";
import { CreateNotificationRecipient } from "../../../application/use-cases/notification-recipient/CreateNotificationRecipient";
import { UpdateNotificationRecipient } from "../../../application/use-cases/notification-recipient/UpdateNotificationRecipient";
import { DeleteNotificationRecipient } from "../../../application/use-cases/notification-recipient/DeleteNotificationRecipient";
import { ToggleNotificationRecipientStatus } from "../../../application/use-cases/notification-recipient/ToggleNotificationRecipientStatus";
import { NotificationRecipientController } from "../controllers/NotificationRecipientController";
import { requireRoles } from "../middleware/RoleMiddleware";

const notificationRecipientRouter = Router();

const recipientRepo = new TypeORMNotificationRecipientRepository(
    AppDataSource.getRepository(NotificationRecipientEntity)
);

const getRecipientsUC = new GetNotificationRecipients(recipientRepo);
const createRecipientUC = new CreateNotificationRecipient(recipientRepo);
const updateRecipientUC = new UpdateNotificationRecipient(recipientRepo);
const deleteRecipientUC = new DeleteNotificationRecipient(recipientRepo);
const toggleStatusUC = new ToggleNotificationRecipientStatus(recipientRepo);

const controller = new NotificationRecipientController(
    getRecipientsUC,
    createRecipientUC,
    updateRecipientUC,
    deleteRecipientUC,
    toggleStatusUC
);

// Endpoints
notificationRecipientRouter.get("/", requireRoles('admin', 'coordinador', 'tecnico', 'consultor', 'auxiliar_inventario'), (req, res) => controller.getAll(req, res));
notificationRecipientRouter.post("/", requireRoles('admin'), (req, res) => controller.create(req, res));
notificationRecipientRouter.put("/:id", requireRoles('admin'), (req, res) => controller.update(req, res));
notificationRecipientRouter.delete("/:id", requireRoles('admin'), (req, res) => controller.delete(req, res));
notificationRecipientRouter.patch("/:id/toggle", requireRoles('admin'), (req, res) => controller.toggleStatus(req, res));

export { notificationRecipientRouter, recipientRepo };
