import { IActivoSoftwareRepository } from "../../../domain/repositories/IActivoSoftwareRepository";
import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { ActivoSoftwareHistory } from "../../../domain/entities/ActivoSoftwareHistory";
import { randomUUID } from "crypto";

export interface UpgradeActivoSoftwareDto {
    activoId: string;
    newSoftwareVersionId: string;
    licencia?: string;
    actualizadoPor: string;
    observaciones?: string;
}

export class UpgradeActivoSoftware {
    constructor(
        private readonly activoSoftwareRepo: IActivoSoftwareRepository,
        private readonly softwareVersionRepo: ISoftwareVersionRepository
    ) {}

    async execute(dto: UpgradeActivoSoftwareDto): Promise<ActivoSoftwareHistory> {
        const newVersion = await this.softwareVersionRepo.findById(dto.newSoftwareVersionId);
        if (!newVersion) {
            throw new Error("La nueva versión de software especificada no existe.");
        }

        // Buscar instalación activa previa de la misma aplicación
        const instalacionPrevia = await this.activoSoftwareRepo.findActiveByActivoAndAppId(dto.activoId, newVersion.softwareAppId);
        const ahora = new Date();

        if (instalacionPrevia) {
            if (instalacionPrevia.softwareVersionId === dto.newSoftwareVersionId) {
                throw new Error("El activo ya tiene instalada exactamente esta versión de la aplicación.");
            }
            instalacionPrevia.marcarActualizado(ahora);
            await this.activoSoftwareRepo.update(instalacionPrevia);
        }

        const nuevaInstalacion = new ActivoSoftwareHistory({
            id: randomUUID(),
            activoId: dto.activoId,
            softwareVersionId: dto.newSoftwareVersionId,
            licencia: dto.licencia ?? (instalacionPrevia ? instalacionPrevia.licencia : undefined),
            estado: 'INSTALADO',
            fechaInstalacion: ahora,
            instaladoPor: dto.actualizadoPor,
            observaciones: dto.observaciones || (instalacionPrevia ? `Actualizado desde versión previa` : undefined)
        });

        await this.activoSoftwareRepo.save(nuevaInstalacion);
        return nuevaInstalacion;
    }
}
