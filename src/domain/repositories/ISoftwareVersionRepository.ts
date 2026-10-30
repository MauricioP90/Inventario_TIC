import { SoftwareVersion } from "../entities/SoftwareVersion";

export interface ISoftwareVersionRepository {
    save(version: SoftwareVersion): Promise<void>;
    findById(id: string): Promise<SoftwareVersion | null>;
    findByAppId(softwareAppId: string): Promise<SoftwareVersion[]>;
    findByAppIdAndVersion(softwareAppId: string, version: string): Promise<SoftwareVersion | null>;
    findVigenteByAppId(softwareAppId: string): Promise<SoftwareVersion | null>;
    update(version: SoftwareVersion): Promise<SoftwareVersion>;
    desmarcarVigentesPorAppId(softwareAppId: string): Promise<void>;
}
