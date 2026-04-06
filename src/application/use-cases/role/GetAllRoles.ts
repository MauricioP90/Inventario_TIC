import { Role } from "../../../domain/entities/Role";
import { IRoleRepository } from "../../../domain/repositories/IRoleRepository";

export class GetAllRoles {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(): Promise<Role[]> {
        return await this.roleRepository.findAll();
    }
}