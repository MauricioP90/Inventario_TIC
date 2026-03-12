import { Request, Response } from "express";
import { CreateSIMCard } from "../../../application/use-cases/sim-card/CreateSIMCard";
import { GetAllSIMCards } from "../../../application/use-cases/sim-card/GetAllSiMCards";
import { AssignSIMToActivo } from "../../../application/use-cases/sim-card/AssignSIMToActivo";
import { UpdateSIMCard } from "../../../application/use-cases/sim-card/UpdateSIMCard";
import { DarDeBajaSIM } from "../../../application/use-cases/sim-card/DarDeBajaSIM";
import { GetOneSIMCard } from "../../../application/use-cases/sim-card/GetOneSIMCard";

export class SIMCardController {
    constructor(
        private readonly createSIMCard: CreateSIMCard,
        private readonly getAllSIMCards: GetAllSIMCards,
        private readonly assignSIMToActivo: AssignSIMToActivo,
        private readonly updateSIMCard: UpdateSIMCard,
        private readonly darDeBajaSIM: DarDeBajaSIM,
        private readonly getOneSIMCard: GetOneSIMCard
    ) { }

    // Método para crear una SIM
    async create(req: Request, res: Response) {
        try {
            const simCard = await this.createSIMCard.execute(req.body);
            res.status(201).json(simCard);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Método para listar todas
    async getAll(req: Request, res: Response) {
        try {
            const sims = await this.getAllSIMCards.execute();
            res.json(sims);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Método para asignar a un activo
    async assign(req: Request, res: Response) {
        try {
            // Recibimos simCardId de la URL y placaActivo del body
            const { simCardId } = req.params;
            const { placaActivo } = req.body;

            await this.assignSIMToActivo.execute({
                simCardId: simCardId as string,
                placaActivo: placaActivo as string
            });
            await res.json({ message: "SIM asignada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Método para dar de baja una SIM
    async desactivate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.darDeBajaSIM.execute({ id: id as string });
            res.json({ message: "SIM Inactivada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }


    // Método para actualizar una SIM
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.updateSIMCard.execute({ id, ...req.body });
            res.json({ message: "SIM actualizada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Método para obtener una SIM
    async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const simCard = await this.getOneSIMCard.execute({ id: id as string });
            res.json(simCard);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
