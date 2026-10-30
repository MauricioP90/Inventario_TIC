import { IModeloActivoRepository } from "../../../domain/repositories/IModeloActivoRepository";
import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { ModeloActivo, EstadoModeloActivo } from "../../../domain/entities/ModeloActivo";

export interface CreateModeloActivoDto {
    tipoActivoId: string;
    marca: string;
    modelo: string;
    estado?: EstadoModeloActivo;
}

export class CreateModeloActivo {
    constructor(
        private readonly modeloActivoRepository: IModeloActivoRepository,
        private readonly tipoActivoRepository: ITipoActivoRepository
    ) {}

    async execute(dto: CreateModeloActivoDto): Promise<ModeloActivo> {
        const tipo = await this.tipoActivoRepository.findById(dto.tipoActivoId);
        if (!tipo) {
            throw new Error(`El tipo de activo especificado no existe`);
        }

        const modelo = new ModeloActivo({
            tipoActivoId: dto.tipoActivoId,
            marca: dto.marca.trim(),
            modelo: dto.modelo.trim(),
            estado: dto.estado || EstadoModeloActivo.ACTIVO
        });

        await this.modeloActivoRepository.save(modelo);
        return modelo;
    }
}
