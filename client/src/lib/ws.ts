import type { WsEvent } from "@kairos/shared";

type EventHandler = (event: WsEvent) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers: EventHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 6;
  private manuallyClosed = false;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string): void {
    this.manuallyClosed = false;
    if (this.ws) {
      const prev = this.ws;
      this.ws = null;
      prev.onclose = null;
      prev.close();
    }

    const wsUrl = `${this.url}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data as string) as WsEvent;
        this.handlers.forEach((h) => h(event));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (!this.manuallyClosed) {
        this.scheduleReconnect(token);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(token: string): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    if (this.reconnectAttempts > this.maxReconnectAttempts) return;
    const delay = Math.min(3000 * this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(token);
    }, delay);
  }

  onEvent(handler: EventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = null;
  }
}

const fallbackWsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:3000/ws`;
const WS_URL = import.meta.env["VITE_WS_URL"] ?? fallbackWsUrl;
export const wsClient = new WsClient(WS_URL);
