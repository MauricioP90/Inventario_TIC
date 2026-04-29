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
import { setupSwagger } from "./infrastructure/http/swagger";
import { keycloak, memoryStore } from "./infrastructure/http/middleware/KeycloakConfig";
import * as path from 'path';


const app = express();
const PORT = 3000;

// Middleware para leer JSON
app.use(express.json());

// Habilitar CORS
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

// Configuración de Sesión (Requerido por Keycloak-connect)
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
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
