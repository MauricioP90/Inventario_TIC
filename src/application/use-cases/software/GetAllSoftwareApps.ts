import { ISoftwareAppRepository } from "../../../domain/repositories/ISoftwareAppRepository";
import { SoftwareApp } from "../../../domain/entities/SoftwareApp";

export class GetAllSoftwareApps {
    constructor(private readonly appRepository: ISoftwareAppRepository) {}

    async execute(): Promise<SoftwareApp[]> {
        return this.appRepository.findAll();
    }
}
