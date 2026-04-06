import { Role } from "../../../domain/entities/Role";
import { IRoleRepository } from "../../../domain/repositories/IRoleRepository";

export class CreateRole {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(role: Role): Promise<Role> {
        return await this.roleRepository.create(role);
    }
}