import { IActivoSoftwareRepository } from "../../../domain/repositories/IActivoSoftwareRepository";
import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { ISoftwareAppRepository } from "../../../domain/repositories/ISoftwareAppRepository";

export interface SoftwareHistoryDetail {
    historyId: string;
    activoId: string;
    appId: string;
    appName: string;
    version: string;
    estado: string;
    licencia: string;
    fechaInstalacion: Date;
    fechaRetiro?: Date;
    instaladoPor: string;
    retiradoPor?: string;
    observaciones?: string;
}

export class GetActivoSoftwareHistory {
    constructor(
        private readonly activoSoftwareRepo: IActivoSoftwareRepository,
        private readonly softwareVersionRepo: ISoftwareVersionRepository,
        private readonly softwareAppRepo: ISoftwareAppRepository
    ) {}

    async execute(activoId: string): Promise<SoftwareHistoryDetail[]> {
        const history = await this.activoSoftwareRepo.findHistoryByActivoId(activoId);
        const details: SoftwareHistoryDetail[] = [];

        for (const item of history) {
            const version = await this.softwareVersionRepo.findById(item.softwareVersionId);
            const app = version ? await this.softwareAppRepo.findById(version.softwareAppId) : null;

            details.push({
                historyId: item.id,
                activoId: item.activoId,
                appId: version ? version.softwareAppId : '',
                appName: app ? app.nombre : 'Aplicación',
                version: version ? version.version.getValue() : '',
                estado: item.estado,
                licencia: item.licencia,
                fechaInstalacion: item.fechaInstalacion,
                fechaRetiro: item.fechaRetiro,
                instaladoPor: item.instaladoPor,
                retiradoPor: item.retiradoPor,
                observaciones: item.observaciones
            });
        }

        return details;
    }
}
