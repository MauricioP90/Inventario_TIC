import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { ModeloActivoEntity } from "../../persistence/typeorm/entities/ModeloActivoEntity";
import { TipoActivoEntity } from "../../persistence/typeorm/entities/TipoActivoEntity";
import { TypeORMModeloActivoRepository } from "../../persistence/typeorm/repositories/TypeORMModeloActivoRepository";
import { TypeORMTipoActivoRepository } from "../../persistence/typeorm/repositories/TypeORMTipoActivoRepository";
import { CreateModeloActivo } from "../../../application/use-cases/modeloActivo/CreateModeloActivo";
import { GetAllModelosActivo } from "../../../application/use-cases/modeloActivo/GetAllModelosActivo";
import { UpdateModeloActivo } from "../../../application/use-cases/modeloActivo/UpdateModeloActivo";
import { DeleteModeloActivo } from "../../../application/use-cases/modeloActivo/DeleteModeloActivo";
import { ModeloActivoController } from "../controllers/ModeloActivoController";
import { requireRoles, requirePermission } from "../middleware/RoleMiddleware";

const modeloActivoRouter = Router();

const modeloActivoRepo = new TypeORMModeloActivoRepository(AppDataSource.getRepository(ModeloActivoEntity));
const tipoActivoRepo = new TypeORMTipoActivoRepository(AppDataSource.getRepository(TipoActivoEntity));

const createModeloActivoUC = new CreateModeloActivo(modeloActivoRepo, tipoActivoRepo);
const getAllModelosActivoUC = new GetAllModelosActivo(modeloActivoRepo);
const updateModeloActivoUC = new UpdateModeloActivo(modeloActivoRepo);
const deleteModeloActivoUC = new DeleteModeloActivo(modeloActivoRepo);

const modeloActivoController = new ModeloActivoController(
    createModeloActivoUC,
    getAllModelosActivoUC,
    updateModeloActivoUC,
    deleteModeloActivoUC
);

modeloActivoRouter.get("/", requireRoles('admin', 'coordinador', 'tecnico', 'consultor', 'auxiliar_inventario'), (req, res) => modeloActivoController.getAll(req, res));
modeloActivoRouter.post("/", requirePermission('catalogs:access'), (req, res) => modeloActivoController.create(req, res));
modeloActivoRouter.put("/:id", requirePermission('catalogs:access'), (req, res) => modeloActivoController.update(req, res));
modeloActivoRouter.delete("/:id", requirePermission('catalogs:access'), (req, res) => modeloActivoController.delete(req, res));

export { modeloActivoRouter };
