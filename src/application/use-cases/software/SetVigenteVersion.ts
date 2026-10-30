import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { SoftwareVersion } from "../../../domain/entities/SoftwareVersion";

export class SetVigenteVersion {
    constructor(private readonly versionRepository: ISoftwareVersionRepository) {}

    async execute(versionId: string): Promise<SoftwareVersion> {
        const version = await this.versionRepository.findById(versionId);
        if (!version) {
            throw new Error("La versión de software no fue encontrada.");
        }

        // Desmarcar todas las otras versiones de esta app
        await this.versionRepository.desmarcarVigentesPorAppId(version.softwareAppId);

        // Marcar esta como vigente
        version.marcarComoVigente();
        return this.versionRepository.update(version);
    }
}
