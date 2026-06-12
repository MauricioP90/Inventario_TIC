import { Request, Response } from "express";
import { CreateMaintenanceReport } from "../../../application/use-cases/maintenance/CreateMaintenanceReport";
import { UpdateMaintenanceReport } from "../../../application/use-cases/maintenance/UpdateMaintenanceReport";
import { GetActiveMaintenance } from "../../../application/use-cases/maintenance/GetActiveMaintenance";
import { GetMaintenanceHistory } from "../../../application/use-cases/maintenance/GetMaintenanceHistory";

export class MaintenanceController {
    constructor(
        private createUC: CreateMaintenanceReport,
        private updateUC: UpdateMaintenanceReport,
        private getActiveUC: GetActiveMaintenance,
        private getHistoryUC: GetMaintenanceHistory
    ) { }

    async create(req: Request, res: Response) {
        try {
            const report = await this.createUC.execute(req.body);
            res.status(201).json(report.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await this.updateUC.execute({ id, ...req.body });
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async getActive(req: Request, res: Response) {
        try {
            const reports = await this.getActiveUC.execute();
            res.json(reports);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getHistory(req: Request, res: Response) {
        try {
            const { activoId } = req.query;
            const reports = await this.getHistoryUC.execute(activoId as string | undefined);
            res.json(reports);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
