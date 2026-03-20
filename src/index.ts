import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import { simCardRouter } from "./infrastructure/http/routes/SIMCardRoutes";
import { LocationRouter } from "./infrastructure/http/routes/LocationRoutes";
import { responsibleRouter } from "./infrastructure/http/routes/ResponsibleRoutes";
import { activoRouter } from "./infrastructure/http/routes/ActivoRoutes";
import { setupSwagger } from "./infrastructure/http/swagger";

const app = express();
const PORT = 3000;

// Middleware para leer JSON
app.use(express.json());

// Registro de Swagger
setupSwagger(app);

// Registro de Rutas
app.use("/api/sim-cards", simCardRouter);
app.use("/api/locations", LocationRouter);
app.use("/api/responsibles", responsibleRouter);
app.use("/api/activos", activoRouter);


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
