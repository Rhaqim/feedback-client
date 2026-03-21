import type { WSMessage } from './types';

type MessageHandler = (payload: Record<string, unknown>) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private url = 'ws://localhost:8080/ws';
  private shouldReconnect = false;
  private statusCallback: ((status: string) => void) | null = null;
  private queue: string[] = [];

  onStatusChange(cb: (status: string) => void) {
    this.statusCallback = cb;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldReconnect = true;
    this.statusCallback?.('reconnecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.statusCallback?.('connected');
        this.reconnectDelay = 2000;
        // Flush any messages queued while connecting
        for (const msg of this.queue) {
          this.ws?.send(msg);
        }
        this.queue = [];
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          const handlers = this.handlers.get(msg.type);
          if (handlers) {
            handlers.forEach((h) => h(msg.payload));
          }
        } catch {
          console.error('Failed to parse WS message', event.data);
        }
      };

      this.ws.onclose = () => {
        this.statusCallback?.('disconnected');
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
            this.connect();
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.statusCallback?.('disconnected');
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.queue = [];
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(type: string, payload: Record<string, unknown>) {
    const data = JSON.stringify({ type, payload });
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else if (this.ws?.readyState === WebSocket.CONNECTING) {
      // Queue messages sent before the connection is open
      this.queue.push(data);
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler);
  }
}

export const ws = new WebSocketManager();
