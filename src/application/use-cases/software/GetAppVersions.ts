import { ISoftwareVersionRepository } from "../../../domain/repositories/ISoftwareVersionRepository";
import { SoftwareVersion } from "../../../domain/entities/SoftwareVersion";

export class GetAppVersions {
    constructor(private readonly versionRepository: ISoftwareVersionRepository) {}

    async execute(softwareAppId: string): Promise<SoftwareVersion[]> {
        return this.versionRepository.findByAppId(softwareAppId);
    }
}
