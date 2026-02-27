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
export class EnrichedEventBus implements EventBus {
  private clients = new Set<WsClient>();

  addClient(client: WsClient): void {
    this.clients.add(client);
  }

  removeClient(client: WsClient): void {
    this.clients.delete(client);
  }

  broadcast(event: WsEvent): void {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === 1) {
        try {
          client.send(payload);
        } catch {
          this.clients.delete(client);
        }
      }
    }
  }

  // EventBus.publish — no-op here; we broadcast directly in routes
  async publish(_events: ReadonlyArray<DomainEvent>): Promise<void> {}
}
