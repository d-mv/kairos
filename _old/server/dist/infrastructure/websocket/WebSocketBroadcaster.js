export class WebSocketBroadcaster {
    clients = new Set();
    addClient(client) {
        this.clients.add(client);
    }
    removeClient(client) {
        this.clients.delete(client);
    }
    async publish(events) {
        for (const event of events) {
            const wsEvent = this.toWsEvent(event);
            if (wsEvent) {
                this.broadcast(wsEvent);
            }
        }
    }
    broadcast(event) {
        const payload = JSON.stringify(event);
        for (const client of this.clients) {
            if (client.readyState === 1) {
                // OPEN
                try {
                    client.send(payload);
                }
                catch {
                    this.clients.delete(client);
                }
            }
        }
    }
    toWsEvent(event) {
        // Map domain events to WebSocket events
        // The actual payload will be enriched by the application layer
        // For now we emit minimal notifications; UI will re-fetch on demand
        switch (event.eventName) {
            case "task.created":
            case "task.updated":
            case "task.completed":
            case "task.reopened":
            case "task.assigned_to_project":
            case "task.assigned_to_area":
            case "task.moved_to_inbox":
                return null; // Will be handled by enriched event bus
            default:
                return null;
        }
    }
}
//# sourceMappingURL=WebSocketBroadcaster.js.map