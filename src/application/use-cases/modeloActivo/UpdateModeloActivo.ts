import { IModeloActivoRepository } from "../../../domain/repositories/IModeloActivoRepository";
import { ModeloActivo, EstadoModeloActivo } from "../../../domain/entities/ModeloActivo";

export interface UpdateModeloActivoDto {
    tipoActivoId?: string;
    marca?: string;
    modelo?: string;
    estado?: EstadoModeloActivo;
}

export class UpdateModeloActivo {
    constructor(private readonly modeloActivoRepository: IModeloActivoRepository) {}

    async execute(id: string, dto: UpdateModeloActivoDto): Promise<ModeloActivo> {
        const existente = await this.modeloActivoRepository.findById(id);
        if (!existente) {
            throw new Error(`El modelo de activo no fue encontrado`);
        }

        existente.update({
            tipoActivoId: dto.tipoActivoId,
            marca: dto.marca?.trim(),
            modelo: dto.modelo?.trim(),
            estado: dto.estado
        });

        return await this.modeloActivoRepository.update(existente);
    }
}
