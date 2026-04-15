/**
 * An event bus that accepts enriched WsEvents directly and broadcasts them to all
 * connected WebSocket clients. Use this for broadcasting after a successful write.
 */
export class EnrichedEventBus {
    clientsByUserId = new Map();
    addClient(userId, client) {
        const clients = this.clientsByUserId.get(userId) ?? new Set();
        clients.add(client);
        this.clientsByUserId.set(userId, clients);
    }
    removeClient(client) {
        for (const [userId, clients] of this.clientsByUserId.entries()) {
            clients.delete(client);
            if (clients.size === 0)
                this.clientsByUserId.delete(userId);
        }
    }
    broadcast(event) {
        const payload = JSON.stringify(event);
        for (const clients of this.clientsByUserId.values()) {
            for (const client of clients) {
                if (client.readyState !== 1)
                    continue;
                try {
                    client.send(payload);
                }
                catch {
                    this.removeClient(client);
                }
            }
        }
    }
    broadcastToUser(userId, event) {
        const payload = JSON.stringify(event);
        const clients = this.clientsByUserId.get(userId);
        if (!clients)
            return;
        for (const client of clients) {
            if (client.readyState === 1) {
                try {
                    client.send(payload);
                }
                catch {
                    this.removeClient(client);
                }
            }
        }
    }
    // EventBus.publish — no-op here; we broadcast directly in routes
    async publish(_events) { }
}
//# sourceMappingURL=EnrichedEventBus.js.map