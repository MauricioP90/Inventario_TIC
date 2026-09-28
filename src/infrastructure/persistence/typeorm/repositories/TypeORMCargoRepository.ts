import { Repository, ILike } from "typeorm";
import { Cargo } from "../../../../domain/entities/Cargo";
import { ICargoRepository } from "../../../../domain/repositories/ICargoRepository";
import { CargoEntity } from "../entities/CargoEntity";
import { CargoMapper } from "../../mappers/CargoMapper";

export class TypeORMCargoRepository implements ICargoRepository {
    constructor(private readonly repository: Repository<CargoEntity>) { }

    async create(cargo: Cargo): Promise<Cargo> {
        const entity = CargoMapper.toPersistence(cargo);
        const saved = await this.repository.save(entity);
        return CargoMapper.toDomain(saved);
    }

    async update(cargo: Cargo): Promise<Cargo> {
        const entity = CargoMapper.toPersistence(cargo);
        const saved = await this.repository.save(entity);
        return CargoMapper.toDomain(saved);
    }

    async findById(id: string): Promise<Cargo | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? CargoMapper.toDomain(entity) : null;
    }

    async findByNombreInsensitive(nombre: string): Promise<Cargo | null> {
        const entity = await this.repository.findOne({
            where: { nombre: ILike(nombre) }
        });
        return entity ? CargoMapper.toDomain(entity) : null;
    }

    async findAll(): Promise<Cargo[]> {
        const entities = await this.repository.find({ order: { nombre: 'ASC' } });
        return entities.map(entity => CargoMapper.toDomain(entity));
    }
}
