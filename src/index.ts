import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import { simCardRouter } from "./infrastructure/http/routes/SIMCardRoutes";

const app = express();
const PORT = 3000;

// Middleware para leer JSON
app.use(express.json());

// Registro de Rutas
app.use("/api/sim-cards", simCardRouter);

// Ruta de salud (Health check)
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
