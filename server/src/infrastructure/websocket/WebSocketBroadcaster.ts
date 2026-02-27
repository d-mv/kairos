import type { DomainEvent } from '../../domain/shared/index.js';
import type { EventBus } from '../../application/EventBus.js';
import type { WsEvent } from '@kairos/shared';

export type BroadcastMessage = WsEvent;

type WsClient = {
  readyState: number;
  send(data: string): void;
};

export class WebSocketBroadcaster implements EventBus {
  private clients = new Set<WsClient>();

  addClient(client: WsClient): void {
    this.clients.add(client);
  }

  removeClient(client: WsClient): void {
    this.clients.delete(client);
  }

  async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      const wsEvent = this.toWsEvent(event);
      if (wsEvent) {
        this.broadcast(wsEvent);
      }
    }
  }

  private broadcast(event: WsEvent): void {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        try {
          client.send(payload);
        } catch {
          this.clients.delete(client);
        }
      }
    }
  }

  private toWsEvent(event: DomainEvent): WsEvent | null {
    // Map domain events to WebSocket events
    // The actual payload will be enriched by the application layer
    // For now we emit minimal notifications; UI will re-fetch on demand
    switch (event.eventName) {
      case 'task.created':
      case 'task.updated':
      case 'task.completed':
      case 'task.reopened':
      case 'task.assigned_to_project':
      case 'task.assigned_to_area':
      case 'task.moved_to_inbox':
        return null; // Will be handled by enriched event bus
      default:
        return null;
    }
  }
}
