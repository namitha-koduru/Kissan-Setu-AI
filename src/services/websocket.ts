/**
 * Real-Time WebSocket Service for KissanSetuAI
 * Handles live chat, bidding events, and instant user notifications with automatic reconnection.
 */

export function getWebSocketBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
  const clean = envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  if (clean.startsWith("https://")) {
    return clean.replace("https://", "wss://");
  }
  if (clean.startsWith("http://")) {
    return clean.replace("http://", "ws://");
  }
  // If window is defined and relative
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return "ws://localhost:8000";
}

export interface WebSocketSubscription {
  close: () => void;
  send: (data: any) => void;
}

export function subscribeNegotiationRoom(
  lotId: number | string,
  onEvent: (event: any) => void
): WebSocketSubscription {
  const numericLotId = typeof lotId === "number" ? lotId : parseInt(String(lotId).replace(/\D/g, ""), 10) || 1;
  const wsUrl = `${getWebSocketBaseUrl()}/api/ws/negotiations/${numericLotId}`;
  
  let ws: WebSocket | null = null;
  let isClosed = false;
  let reconnectTimeout: any = null;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.info(`[WS] Connected to negotiation room: lot_${numericLotId}`);
      };
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onEvent(parsed);
        } catch (e) {
          console.warn("[WS] Failed to parse message:", event.data);
        }
      };
      ws.onclose = () => {
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
      ws.onerror = (err) => {
        console.warn("[WS] Negotiation connection warning:", err);
      };
    } catch (err) {
      console.warn("[WS] Connection init error:", err);
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return {
    close() {
      isClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    },
    send(data: any) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof data === "string" ? data : JSON.stringify(data));
      }
    },
  };
}

export function subscribeUserNotifications(
  userId: string | number,
  onNotification: (notif: any) => void
): WebSocketSubscription {
  const wsUrl = `${getWebSocketBaseUrl()}/api/ws/notifications/${userId}`;
  let ws: WebSocket | null = null;
  let isClosed = false;
  let reconnectTimeout: any = null;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.info(`[WS] Connected to user notifications: ${userId}`);
      };
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onNotification(parsed);
        } catch (e) {
          console.warn("[WS] Notification parse error:", event.data);
        }
      };
      ws.onclose = () => {
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 4000);
        }
      };
      ws.onerror = (err) => {
        console.warn("[WS] Notification socket warning:", err);
      };
    } catch (err) {
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }
  }

  connect();

  return {
    close() {
      isClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    },
    send(data: any) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof data === "string" ? data : JSON.stringify(data));
      }
    },
  };
}
