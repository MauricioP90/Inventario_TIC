import { Router } from "express";
import { AppDataSource } from "../../../data-source";
import { CargoEntity } from "../../persistence/typeorm/entities/CargoEntity";
import { TypeORMCargoRepository } from "../../persistence/typeorm/repositories/TypeORMCargoRepository";
import { GetAllCargos } from "../../../application/use-cases/cargo/GetAllCargos";
import { CreateCargo } from "../../../application/use-cases/cargo/CreateCargo";
import { UpdateCargo } from "../../../application/use-cases/cargo/UpdateCargo";
import { ToggleCargoStatus } from "../../../application/use-cases/cargo/ToggleCargoStatus";
import { CargoController } from "../controllers/CargoController";
import { requireRoles } from "../middleware/RoleMiddleware";

const cargoRouter = Router();

const cargoRepo = new TypeORMCargoRepository(AppDataSource.getRepository(CargoEntity));

const getAllCargosUC = new GetAllCargos(cargoRepo);
const createCargoUC = new CreateCargo(cargoRepo);
const updateCargoUC = new UpdateCargo(cargoRepo);
const toggleCargoStatusUC = new ToggleCargoStatus(cargoRepo);

const cargoController = new CargoController(getAllCargosUC, createCargoUC, updateCargoUC, toggleCargoStatusUC);

cargoRouter.get("/", requireRoles('admin', 'coordinador', 'tecnico', 'consultor', 'auxiliar_inventario'), (req, res) => cargoController.getAll(req, res));
cargoRouter.post("/", requireRoles('admin'), (req, res) => cargoController.create(req, res));
cargoRouter.put("/:id", requireRoles('admin'), (req, res) => cargoController.update(req, res));
cargoRouter.patch("/:id/toggle", requireRoles('admin'), (req, res) => cargoController.toggleStatus(req, res));

export { cargoRouter };
