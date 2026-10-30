import { IModeloActivoRepository } from "../../../domain/repositories/IModeloActivoRepository";

export class DeleteModeloActivo {
    constructor(private readonly modeloActivoRepository: IModeloActivoRepository) {}

    async execute(id: string): Promise<void> {
        const existente = await this.modeloActivoRepository.findById(id);
        if (!existente) {
            throw new Error(`El modelo de activo no fue encontrado`);
        }
        await this.modeloActivoRepository.delete(id);
    }
}
