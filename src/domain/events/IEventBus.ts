import { IDomainEvent } from "./IDomainEvent";

export type DomainEventHandler<T extends IDomainEvent = any> = (event: T) => Promise<void> | void;

export interface IEventBus {
    publish<T extends IDomainEvent>(event: T): Promise<void>;
    publishAll(events: IDomainEvent[]): Promise<void>;
    subscribe<T extends IDomainEvent>(eventName: string, handler: DomainEventHandler<T>): void;
}
