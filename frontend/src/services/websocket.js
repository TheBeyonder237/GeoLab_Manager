import { store } from '../store';
import { addNotification } from '../store/slices/notificationsSlice';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.pingInterval = null;
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/notifications?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connecté');
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onclose = (e) => {
      console.log('WebSocket déconnecté:', e.reason);
      this.clearPingInterval();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Gérer les messages pong
        if (data.type === 'pong') {
          return;
        }

        // Ajouter la notification au store Redux
        store.dispatch(addNotification(data));

        // Afficher une notification système si supporté
        if (Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/logo.png'
          });
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.clearPingInterval();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Tentative de reconnexion ${this.reconnectAttempts}...`);
      this.connect();
    }, delay);
  }

  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping toutes les 30 secondes
  }

  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Méthode pour demander la permission des notifications système
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      return;
    }

    if (Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  }
}

export const wsService = new WebSocketService();

// Demander la permission des notifications au chargement
WebSocketService.requestNotificationPermission();
