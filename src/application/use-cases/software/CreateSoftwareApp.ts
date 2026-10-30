import { ISoftwareAppRepository } from "../../../domain/repositories/ISoftwareAppRepository";
import { SoftwareApp } from "../../../domain/entities/SoftwareApp";
import { randomUUID } from "crypto";

export interface CreateSoftwareAppDto {
    nombre: string;
    descripcion?: string;
    estado?: 'ACTIVO' | 'INACTIVO';
}

export class CreateSoftwareApp {
    constructor(private readonly appRepository: ISoftwareAppRepository) {}

    async execute(dto: CreateSoftwareAppDto): Promise<SoftwareApp> {
        if (!dto.nombre || dto.nombre.trim().length === 0) {
            throw new Error("El nombre de la aplicación de software es obligatorio.");
        }

        const existente = await this.appRepository.findByNombre(dto.nombre.trim());
        if (existente) {
            throw new Error(`Ya existe una aplicación de software registrada con el nombre "${dto.nombre.trim()}".`);
        }

        const app = new SoftwareApp({
            id: randomUUID(),
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            estado: dto.estado || 'ACTIVO'
        });

        await this.appRepository.save(app);
        return app;
    }
}
