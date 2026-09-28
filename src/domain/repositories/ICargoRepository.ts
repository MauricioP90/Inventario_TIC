import { Cargo } from '../entities/Cargo';

export interface ICargoRepository {
    create(cargo: Cargo): Promise<Cargo>;
    update(cargo: Cargo): Promise<Cargo>;
    findById(id: string): Promise<Cargo | null>;
    findByNombreInsensitive(nombre: string): Promise<Cargo | null>;
    findAll(): Promise<Cargo[]>;
}
