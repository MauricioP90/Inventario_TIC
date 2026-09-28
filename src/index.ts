import * as dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import express from "express";
import cors from "cors";
import session from "express-session";
import { AppDataSource } from "./data-source";
import { simCardRouter } from "./infrastructure/http/routes/SIMCardRoutes";
import { LocationRouter } from "./infrastructure/http/routes/LocationRoutes";
import { responsibleRouter } from "./infrastructure/http/routes/ResponsibleRoutes";
import { activoRouter } from "./infrastructure/http/routes/ActivoRoutes";
import { movementRouter } from "./infrastructure/http/routes/MovementRoutes";
import { fileRouter } from "./infrastructure/http/routes/FileRoutes";
import { maintenanceRouter } from "./infrastructure/http/routes/MaintenanceRoutes";
import { AreaRouter } from "./infrastructure/http/routes/AreaRoutes";
import { notificationRecipientRouter } from "./infrastructure/http/routes/NotificationRecipientRoutes";
import { cargoRouter } from "./infrastructure/http/routes/CargoRoutes";
import { setupSwagger } from "./infrastructure/http/swagger";
import { keycloak, memoryStore } from "./infrastructure/http/middleware/KeycloakConfig";
import * as path from 'path';


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para leer JSON con límite extendido para carga de archivos Base64 (hasta 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Habilitar CORS configurable (soporta múltiples orígenes separados por comas)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (requestOrigin, callback) => {
        if (!requestOrigin || allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)) {
            callback(null, true);
        } else {
            callback(new Error(`Bloqueado por política CORS: Origen ${requestOrigin} no autorizado`));
        }
    },
    credentials: true
}));

// Configuración de Sesión (Requerido por Keycloak-connect)
const sessionSecret = process.env.SESSION_SECRET || 'a_very_secret_key_123';
if (process.env.NODE_ENV === 'production' && sessionSecret === 'a_very_secret_key_123') {
    console.warn('⚠️ [Seguridad] SESSION_SECRET por defecto detectado. Se recomienda definir un secreto robusto en el archivo .env');
}

app.use(
    session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: true,
        store: memoryStore
    })
);

// Inicialización de Keycloak
app.use(keycloak.middleware());

// Registro de Swagger
setupSwagger(app);

// Servir archivos estáticos (facturas, soportes)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Registro de Rutas
app.use("/api/sim-cards", simCardRouter);
app.use("/api/locations", LocationRouter);
app.use("/api/responsibles", responsibleRouter);
app.use("/api/movements", movementRouter);
app.use("/api/activos", activoRouter);
app.use("/api/files", fileRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/areas", AreaRouter);
app.use("/api/notification-recipients", notificationRecipientRouter);
app.use("/api/cargos", cargoRouter);


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del sistema
 *     tags: [Mantenimiento]
 *     responses:
 *       200:
 *         description: El sistema está operacional
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Operacional"
 *                 timestamp:
 *                   type: string
 *                   format: "date-time"
 */
app.get("/health", (req, res) => {
    res.json({ status: "Operacional", timestamp: new Date().toISOString() });
});

// Inicialización de Base de Datos y Servidor
AppDataSource.initialize()
    .then(() => {
        console.log("✅ Base de Datos conectada.");
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Error al conectar la Base de Datos:", error);
    });
