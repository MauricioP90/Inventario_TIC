import { Role } from "../entities/Role";

export interface IRoleRepository {
    create(role: Role): Promise<Role>;
    update(role: Role): Promise<Role>;
    activate(id: string): Promise<Role>;
    inactivate(id: string): Promise<Role>;
    findById(id: string): Promise<Role | null>;
    findAll(): Promise<Role[]>;
}
