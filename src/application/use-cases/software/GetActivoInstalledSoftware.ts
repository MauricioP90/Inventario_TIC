import { IActivoSoftwareRepository } from "../../../domain/repositories/IActivoSoftwareRepository";
import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { ISoftwareAppRepository } from "../../../domain/repositories/ISoftwareAppRepository";
import { SoftwareVersionVO } from "../../../domain/value-objects/SoftwareVersionVO";

export interface InstalledSoftwareEvaluation {
    historyId: string;
    activoId: string;
    appId: string;
    appName: string;
    versionId: string;
    installedVersion: string;
    vigenteVersion: string | null;
    semaforo: 'AL_DIA' | 'DESACTUALIZADO' | 'BETA' | 'SIN_VIGENTE';
    licencia: string;
    fechaInstalacion: Date;
    instaladoPor: string;
    observaciones: string;
}

export class GetActivoInstalledSoftware {
    constructor(
        private readonly activoSoftwareRepo: IActivoSoftwareRepository,
        private readonly softwareVersionRepo: ISoftwareVersionRepository,
        private readonly softwareAppRepo: ISoftwareAppRepository
    ) {}

    async execute(activoId: string): Promise<InstalledSoftwareEvaluation[]> {
        const activosInstalados = await this.activoSoftwareRepo.findActiveByActivoId(activoId);
        const evaluations: InstalledSoftwareEvaluation[] = [];

        for (const item of activosInstalados) {
            const version = await this.softwareVersionRepo.findById(item.softwareVersionId);
            if (!version) continue;

            const app = await this.softwareAppRepo.findById(version.softwareAppId);
            const appName = app ? app.nombre : 'Aplicación Desconocida';

            const vigente = await this.softwareVersionRepo.findVigenteByAppId(version.softwareAppId);

            let semaforo: 'AL_DIA' | 'DESACTUALIZADO' | 'BETA' | 'SIN_VIGENTE' = 'SIN_VIGENTE';
            let vigenteStr: string | null = null;

            if (vigente) {
                vigenteStr = vigente.version.getValue();
                const installedVO = SoftwareVersionVO.create(version.version.getValue());
                const vigenteVO = vigente.version;

                if (installedVO.equals(vigenteVO)) {
                    semaforo = 'AL_DIA';
                } else if (installedVO.isLessThan(vigenteVO)) {
                    semaforo = 'DESACTUALIZADO';
                } else {
                    semaforo = 'BETA';
                }
            }

            evaluations.push({
                historyId: item.id,
                activoId: item.activoId,
                appId: version.softwareAppId,
                appName,
                versionId: version.id,
                installedVersion: version.version.getValue(),
                vigenteVersion: vigenteStr,
                semaforo,
                licencia: item.licencia,
                fechaInstalacion: item.fechaInstalacion,
                instaladoPor: item.instaladoPor,
                observaciones: item.observaciones
            });
        }

        return evaluations;
    }
}
