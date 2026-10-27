import { IEventBus, IDomainEvent, DomainEventHandler } from "../../domain/events";

export class InMemoryEventBus implements IEventBus {
    private handlers: Map<string, DomainEventHandler[]> = new Map();

    subscribe<T extends IDomainEvent>(eventName: string, handler: DomainEventHandler<T>): void {
        const current = this.handlers.get(eventName) || [];
        this.handlers.set(eventName, [...current, handler]);
    }

    async publish<T extends IDomainEvent>(event: T): Promise<void> {
        const handlers = this.handlers.get(event.eventName) || [];
        for (const handler of handlers) {
            try {
                await handler(event);
            } catch (error: any) {
                console.error(`[InMemoryEventBus] Error al procesar evento "${event.eventName}":`, error?.message || error);
            }
        }
    }

    async publishAll(events: IDomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }
}
