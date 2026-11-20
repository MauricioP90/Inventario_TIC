import { IActivoSoftwareRepository } from "../../../domain/repositories/IActivoSoftwareRepository";
import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ActivoSoftwareHistory } from "../../../domain/entities/ActivoSoftwareHistory";
import { randomUUID } from "crypto";

export interface InstallActivoSoftwareDto {
    activoId: string;
    softwareVersionId: string;
    licencia?: string;
    instaladoPor: string;
    observaciones?: string;
}

export class InstallActivoSoftware {
    constructor(
        private readonly activoSoftwareRepo: IActivoSoftwareRepository,
        private readonly softwareVersionRepo: ISoftwareVersionRepository,
        private readonly activoRepo?: IActivoRepository
    ) {}

    async execute(dto: InstallActivoSoftwareDto): Promise<ActivoSoftwareHistory> {
        if (this.activoRepo) {
            const activo = await this.activoRepo.findById(dto.activoId);
            if (!activo) {
                throw new Error("El activo especificado no existe.");
            }
            if (!activo.tipoActivo?.admiteSoftware) {
                throw new Error(
                    `El activo [${activo.placa}] pertenece al tipo "${activo.tipoActivo?.nombre || 'Sin tipo'}", el cual no admite instalación de software.`
                );
            }
        }

        const version = await this.softwareVersionRepo.findById(dto.softwareVersionId);
        if (!version) {
            throw new Error("La versión de software seleccionada no existe.");
        }

        // Verificar si este activo ya tiene instalada alguna versión activa de esta app
        const instaladaPrevia = await this.activoSoftwareRepo.findActiveByActivoAndAppId(dto.activoId, version.softwareAppId);
        if (instaladaPrevia) {
            throw new Error("Este activo ya tiene una versión instalada de esta aplicación. Utiliza la opción 'Actualizar Versión' para registrar una nueva.");
        }

        const history = new ActivoSoftwareHistory({
            id: randomUUID(),
            activoId: dto.activoId,
            softwareVersionId: dto.softwareVersionId,
            licencia: dto.licencia,
            estado: 'INSTALADO',
            fechaInstalacion: new Date(),
            instaladoPor: dto.instaladoPor,
            observaciones: dto.observaciones
        });

        await this.activoSoftwareRepo.save(history);
        return history;
    }
}
