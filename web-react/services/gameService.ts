import { ServerMessage } from '../types';

type MessageHandler = (msg: ServerMessage) => void;

class GameService {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  
  public connect(url: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          this.sendMessage({ op: 'LOGIN', user: username });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // The server sends newline-delimited JSON. 
            // We might receive multiple messages in one packet or one message per packet.
            const lines = (event.data as string).split('\n').filter(line => line.trim());
            
            lines.forEach(line => {
              const msg = JSON.parse(line);
              this.notifyHandlers(msg);
            });
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          reject(err);
        };

        this.ws.onclose = () => {
          console.log('Disconnected');
        };

      } catch (e) {
        reject(e);
      }
    });
  }

  public sendMessage(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Debug: log outgoing messages so we can verify PLACE_LINE payloads
      try {
        console.debug('[gameService] SEND', msg);
      } catch (e) { /* ignore */ }
      this.ws.send(JSON.stringify(msg) + '\n');
    } else {
      console.warn('WebSocket not open, cannot send:', msg);
    }
  }

  public subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private notifyHandlers(msg: ServerMessage) {
    this.messageHandlers.forEach(handler => handler(msg));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const gameService = new GameService();