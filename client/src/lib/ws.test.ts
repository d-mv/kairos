import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { WsClient } from "./ws.js";

type MockSocket = {
  url: string;
  sent: string[];
  onopen: (() => void) | null;
  onmessage: ((message: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  close(): void;
  send(data: string): void;
};

const originalWebSocket = globalThis.WebSocket;
const sockets: MockSocket[] = [];

class TestWebSocket implements MockSocket {
  url: string;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((message: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string | URL) {
    this.url = String(url);
    sockets.push(this);
  }

  close(): void {}

  send(data: string): void {
    this.sent.push(data);
  }
}

afterEach(() => {
  sockets.length = 0;
  globalThis.WebSocket = originalWebSocket;
});

test("WsClient sends auth after open without putting the token in the websocket url", () => {
  globalThis.WebSocket = TestWebSocket as unknown as typeof WebSocket;

  const client = new WsClient("wss://example.test/ws");
  client.connect("secret-token");

  const socket = sockets[0];
  assert.ok(socket);
  assert.equal(socket.url, "wss://example.test/ws");

  socket.onopen?.();

  assert.deepEqual(socket.sent, [JSON.stringify({ type: "auth", token: "secret-token" })]);
});
