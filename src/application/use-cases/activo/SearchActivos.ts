import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { SearchActivosQuery, SearchActivosResult } from "../../../domain/repositories/SearchActivosQuery";

export class SearchActivos {
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(query: SearchActivosQuery): Promise<SearchActivosResult> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

        return await this.activoRepository.search({
            ...query,
            page,
            limit
        });
    }
}
