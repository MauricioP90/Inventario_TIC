import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { SoftwareAppEntity } from "../../persistence/typeorm/entities/SoftwareAppEntity";
import { SoftwareVersionEntity } from "../../persistence/typeorm/entities/SoftwareVersionEntity";
import { ActivoSoftwareHistoryEntity } from "../../persistence/typeorm/entities/ActivoSoftwareHistoryEntity";
import { TypeORMSoftwareAppRepository } from "../../persistence/typeorm/repositories/TypeORMSoftwareAppRepository";
import { TypeORMSoftwareVersionRepository } from "../../persistence/typeorm/repositories/TypeORMSoftwareVersionRepository";
import { TypeORMActivoSoftwareRepository } from "../../persistence/typeorm/repositories/TypeORMActivoSoftwareRepository";
import { CreateSoftwareApp } from "../../../application/use-cases/software/CreateSoftwareApp";
import { GetAllSoftwareApps } from "../../../application/use-cases/software/GetAllSoftwareApps";
import { AddSoftwareVersion } from "../../../application/use-cases/software/AddSoftwareVersion";
import { GetAppVersions } from "../../../application/use-cases/software/GetAppVersions";
import { SetVigenteVersion } from "../../../application/use-cases/software/SetVigenteVersion";
import { InstallActivoSoftware } from "../../../application/use-cases/software/InstallActivoSoftware";
import { UpgradeActivoSoftware } from "../../../application/use-cases/software/UpgradeActivoSoftware";
import { RetireActivoSoftware } from "../../../application/use-cases/software/RetireActivoSoftware";
import { GetActivoInstalledSoftware } from "../../../application/use-cases/software/GetActivoInstalledSoftware";
import { GetActivoSoftwareHistory } from "../../../application/use-cases/software/GetActivoSoftwareHistory";
import { SoftwareController } from "../controllers/SoftwareController";
import { keycloak } from "../middleware/KeycloakConfig";

const softwareRouter = Router();

const appRepo = new TypeORMSoftwareAppRepository(AppDataSource.getRepository(SoftwareAppEntity));
const versionRepo = new TypeORMSoftwareVersionRepository(AppDataSource.getRepository(SoftwareVersionEntity));
const historyRepo = new TypeORMActivoSoftwareRepository(AppDataSource.getRepository(ActivoSoftwareHistoryEntity));

const createSoftwareAppUC = new CreateSoftwareApp(appRepo);
const getAllSoftwareAppsUC = new GetAllSoftwareApps(appRepo);
const addSoftwareVersionUC = new AddSoftwareVersion(versionRepo, appRepo);
const getAppVersionsUC = new GetAppVersions(versionRepo);
const setVigenteVersionUC = new SetVigenteVersion(versionRepo);
const installActivoSoftwareUC = new InstallActivoSoftware(historyRepo, versionRepo);
const upgradeActivoSoftwareUC = new UpgradeActivoSoftware(historyRepo, versionRepo);
const retireActivoSoftwareUC = new RetireActivoSoftware(historyRepo);
const getActivoInstalledSoftwareUC = new GetActivoInstalledSoftware(historyRepo, versionRepo, appRepo);
const getActivoSoftwareHistoryUC = new GetActivoSoftwareHistory(historyRepo, versionRepo, appRepo);

const softwareController = new SoftwareController(
    createSoftwareAppUC,
    getAllSoftwareAppsUC,
    addSoftwareVersionUC,
    getAppVersionsUC,
    setVigenteVersionUC,
    installActivoSoftwareUC,
    upgradeActivoSoftwareUC,
    retireActivoSoftwareUC,
    getActivoInstalledSoftwareUC,
    getActivoSoftwareHistoryUC
);

// Apps
softwareRouter.get("/apps", keycloak.protect(), (req, res) => softwareController.getAllApps(req, res));
softwareRouter.post("/apps", keycloak.protect(), (req, res) => softwareController.createApp(req, res));

// Versions
softwareRouter.get("/apps/:appId/versions", keycloak.protect(), (req, res) => softwareController.getAppVersions(req, res));
softwareRouter.post("/apps/:appId/versions", keycloak.protect(), (req, res) => softwareController.addVersion(req, res));
softwareRouter.put("/versions/:versionId/vigente", keycloak.protect(), (req, res) => softwareController.setVigenteVersion(req, res));

// Activos (Software vinculations)
softwareRouter.get("/activos/:activoId/installed", keycloak.protect(), (req, res) => softwareController.getInstalledSoftware(req, res));
softwareRouter.get("/activos/:activoId/history", keycloak.protect(), (req, res) => softwareController.getHistory(req, res));
softwareRouter.post("/activos/:activoId/install", keycloak.protect(), (req, res) => softwareController.installSoftware(req, res));
softwareRouter.put("/activos/:activoId/upgrade", keycloak.protect(), (req, res) => softwareController.upgradeSoftware(req, res));
softwareRouter.put("/history/:historyId/retire", keycloak.protect(), (req, res) => softwareController.retireSoftware(req, res));

export { softwareRouter };
