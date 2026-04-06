import { Role } from "../../../domain/entities/Role";
import { IRoleRepository } from "../../../domain/repositories/IRoleRepository";

export class GetOneRole {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(id: string): Promise<Role | null> {
        return await this.roleRepository.findById(id);
    }
}