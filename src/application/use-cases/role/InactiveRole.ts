import { Role } from "../../../domain/entities/Role";
import { IRoleRepository } from "../../../domain/repositories/IRoleRepository";

export class InactiveRole {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(id: string): Promise<Role> {
        const role = await this.roleRepository.findById(id);
        if (!role) throw new Error('Rol no encontrado');
        role.inactivate();
        return await this.roleRepository.update(role);
    }
}