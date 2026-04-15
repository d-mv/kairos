import type { DomainEvent } from "../../domain/shared/index.js";
import type { EventBus } from "../../application/EventBus.js";
import type { WsEvent } from "@kairos/shared";
type WsClient = {
    readyState: number;
    send(data: string): void;
};
/**
 * An event bus that accepts enriched WsEvents directly and broadcasts them to all
 * connected WebSocket clients. Use this for broadcasting after a successful write.
 */
export declare class EnrichedEventBus implements EventBus {
    private clientsByUserId;
    addClient(userId: string, client: WsClient): void;
    removeClient(client: WsClient): void;
    broadcast(event: WsEvent): void;
    broadcastToUser(userId: string, event: WsEvent): void;
    publish(_events: ReadonlyArray<DomainEvent>): Promise<void>;
}
export {};
//# sourceMappingURL=EnrichedEventBus.d.ts.map