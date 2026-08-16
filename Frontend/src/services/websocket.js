// Production-grade Real-time WebSocket & Cross-Tab Broadcast Client for PIP SaaS
class RealtimeSocketService {
  constructor() {
    this.listeners = new Map();
    this.subscribers = [];
    this.ws = null;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.url = (import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001/ws');
    this.connected = false;

    // Cross-tab broadcast channel for instant multi-tab synchronization
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        this.channel = new BroadcastChannel('pip_realtime_sync_channel');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this._dispatchLocal(event.data.type, event.data.payload);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment:', e);
    }

    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('⚡ Real-time WebSocket connected to User Service (:8001)');
        
        // Start ping heartbeat
        clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type && data.type !== 'pong') {
            this._dispatchLocal(data.type, data.payload);
            if (this.channel) {
              this.channel.postMessage({ type: data.type, payload: data.payload });
            }
          }
        } catch (err) {}
      };

      this.ws.onclose = () => {
        this.connected = false;
        clearInterval(this.pingTimer);
        this._scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        try { this.ws.close(); } catch (e) {}
      };
    } catch (err) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  _dispatchLocal(event, payload) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error('WS listener error:', e); }
    });

    this.subscribers.forEach((cb) => {
      try { cb({ type: event, payload }); } catch (e) { console.error('WS subscriber error:', e); }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => {
      const list = this.listeners.get(event) || [];
      this.listeners.set(event, list.filter((cb) => cb !== callback));
    };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  emit(event, payload) {
    this._dispatchLocal(event, payload);
    if (this.channel) {
      try {
        this.channel.postMessage({ type: event, payload });
      } catch (e) {}
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: event, payload }));
      } catch (e) {}
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const realtimeSocket = new RealtimeSocketService();
export const permissionSocket = realtimeSocket;
