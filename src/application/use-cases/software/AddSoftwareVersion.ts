import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { ISoftwareAppRepository } from "../../../domain/repositories/ISoftwareAppRepository";
import { SoftwareVersion } from "../../../domain/entities/SoftwareVersion";
import { SoftwareVersionVO } from "../../../domain/value-objects/SoftwareVersionVO";
import { randomUUID } from "crypto";

export interface AddSoftwareVersionDto {
    softwareAppId: string;
    version: string;
    esVigente?: boolean;
    notasLanzamiento?: string;
    fechaLanzamiento?: Date;
}

export class AddSoftwareVersion {
    constructor(
        private readonly versionRepository: ISoftwareVersionRepository,
        private readonly appRepository: ISoftwareAppRepository
    ) {}

    async execute(dto: AddSoftwareVersionDto): Promise<SoftwareVersion> {
        const app = await this.appRepository.findById(dto.softwareAppId);
        if (!app) {
            throw new Error(`La aplicación de software no existe.`);
        }

        const vo = SoftwareVersionVO.create(dto.version);

        const existente = await this.versionRepository.findByAppIdAndVersion(dto.softwareAppId, vo.getValue());
        if (existente) {
            throw new Error(`La versión "${vo.getValue()}" ya se encuentra registrada para la aplicación "${app.nombre}".`);
        }

        if (dto.esVigente) {
            await this.versionRepository.desmarcarVigentesPorAppId(dto.softwareAppId);
        }

        const version = new SoftwareVersion({
            id: randomUUID(),
            softwareAppId: dto.softwareAppId,
            version: vo,
            esVigente: dto.esVigente ?? false,
            notasLanzamiento: dto.notasLanzamiento,
            fechaLanzamiento: dto.fechaLanzamiento || new Date()
        });

        await this.versionRepository.save(version);
        return version;
    }
}
