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
import { modeloActivoRouter } from "./infrastructure/http/routes/ModeloActivoRoutes";
import { softwareRouter } from "./infrastructure/http/routes/SoftwareRoutes";
import { telemetryRouter } from "./infrastructure/http/routes/TelemetryRoutes";
import { rolePermissionRouter } from "./infrastructure/http/routes/RolePermissionRoutes";
import { RolePermissionService } from "./infrastructure/security/RolePermissionService";
import { setupSwagger } from "./infrastructure/http/swagger";
import { keycloak, memoryStore } from "./infrastructure/http/middleware/KeycloakConfig";
import { securityHeadersMiddleware } from "./infrastructure/http/middleware/SecurityHeadersMiddleware";
import { apiGeneralRateLimiter } from "./infrastructure/http/middleware/RateLimitMiddleware";
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Ocultar cabecera X-Powered-By y habilitar confianza en reverse proxy Nginx
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Cabeceras HTTP de Seguridad
app.use(securityHeadersMiddleware);

// Middleware para leer JSON con límite estricto de 2MB global y 15MB en rutas de subida de archivos (hasta 10MB binarios)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/files/upload') || req.path.includes('/receive')) {
        return express.json({ limit: '15mb' })(req, res, (err) => {
            if (err) return next(err);
            express.urlencoded({ limit: '15mb', extended: true })(req, res, next);
        });
    }
    return express.json({ limit: '2mb' })(req, res, (err) => {
        if (err) return next(err);
        express.urlencoded({ limit: '2mb', extended: true })(req, res, next);
    });
});

// Habilitar CORS configurable restringido a lista blanca
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (requestOrigin, callback) => {
        if (!requestOrigin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(requestOrigin)) {
            return callback(null, true);
        }
        if (process.env.NODE_ENV !== 'production' && (requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:'))) {
            return callback(null, true);
        }
        callback(new Error(`Bloqueado por política CORS: Origen ${requestOrigin} no autorizado`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Api-Key', 'Accept'],
    credentials: true
}));

// Configuración de Sesión endurecida (Requerido por Keycloak-connect)
const sessionSecret = process.env.SESSION_SECRET || 'a_very_secret_key_123';
if (process.env.NODE_ENV === 'production') {
    if (!process.env.SESSION_SECRET || sessionSecret === 'a_very_secret_key_123') {
        throw new Error('❌ [Seguridad Crítica] SESSION_SECRET no configurado o inseguro en entorno de producción. Defina un secreto criptográfico en .env.');
    }
} else if (sessionSecret === 'a_very_secret_key_123') {
    console.warn('⚠️ [Seguridad] SESSION_SECRET por defecto detectado en modo desarrollo. Configure una clave segura antes de pasar a producción.');
}

app.use(
    session({
        name: 'flm.sid',
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: memoryStore,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        }
    })
);

// Inicialización de Keycloak
app.use(keycloak.middleware());

// Registro de Swagger (protegido exclusivamente para rol admin)
setupSwagger(app);

// Servir archivos estáticos locales de forma segura (sin ejecución de scripts)
app.use('/uploads', (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiter general para la API
app.use('/api', apiGeneralRateLimiter);

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
app.use("/api/modelos-activos", modeloActivoRouter);
app.use("/api/software", softwareRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/role-permissions", rolePermissionRouter);


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
    .then(async () => {
        console.log("✅ Base de Datos conectada.");
        await RolePermissionService.getInstance().loadFromDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Error al conectar la Base de Datos:", error);
    });
