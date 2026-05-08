import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 3001;

const http = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('InstaSpy Relay Server\n');
});

const wss = new WebSocketServer({ server: http });

// token -> { parent: WebSocket | null, child: WebSocket | null }
const sessions = new Map();

function send(ws, data) {
  if (ws && ws.readyState === 1) ws.send(typeof data === 'string' ? data : JSON.stringify(data));
}

wss.on('connection', (ws) => {
  let token = null;
  let role  = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── Join as parent or child ──────────────────────────────────────────────
    if (msg.type === 'parent:join' || msg.type === 'child:join') {
      token = msg.token;
      role  = msg.type === 'parent:join' ? 'parent' : 'child';

      if (!sessions.has(token)) sessions.set(token, { parent: null, child: null });
      const session = sessions.get(token);
      session[role] = ws;

      // Notify parent if child just joined an existing session
      if (role === 'child' && session.parent) {
        send(session.parent, { type: 'child:connected' });
      }
      // Notify parent if child was already waiting
      if (role === 'parent' && session.child) {
        send(ws, { type: 'child:connected' });
      }
      return;
    }

    // ── Relay all other messages to the other side ───────────────────────────
    if (!token || !sessions.has(token)) return;
    const { parent, child } = sessions.get(token);

    if (role === 'child')  send(parent, raw.toString());
    if (role === 'parent') send(child,  raw.toString());
  });

  ws.on('close', () => {
    if (!token || !sessions.has(token)) return;
    const session = sessions.get(token);

    if (role === 'parent') {
      session.parent = null;
      send(session.child, { type: 'parent:disconnected' });
    }
    if (role === 'child') {
      session.child = null;
      send(session.parent, { type: 'child:disconnected' });
    }

    if (!session.parent && !session.child) sessions.delete(token);
  });

  ws.on('error', () => {});
});

http.listen(PORT, () => {
  console.log(`✓ Relay server  →  ws://localhost:${PORT}`);
  console.log(`  Sessions kept in memory (no persistence)`);
});
