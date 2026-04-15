import type { DomainEvent } from "../../domain/shared/index.js";
import type { EventBus } from "../../application/EventBus.js";
import type { WsEvent } from "@kairos/shared";
export type BroadcastMessage = WsEvent;
type WsClient = {
    readyState: number;
    send(data: string): void;
};
export declare class WebSocketBroadcaster implements EventBus {
    private clients;
    addClient(client: WsClient): void;
    removeClient(client: WsClient): void;
    publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
    private broadcast;
    private toWsEvent;
}
export {};
//# sourceMappingURL=WebSocketBroadcaster.d.ts.map