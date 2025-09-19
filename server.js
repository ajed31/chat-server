const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const PASSWORD = 'chat123'; // 

let clients = [];

wss.on('connection', function connection(ws) {
  ws.isAuthorized = false;

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);

      if (data.type === 'login') {
        if (data.password === PASSWORD) {
          ws.isAuthorized = true;
          ws.send(JSON.stringify({ type: 'login', success: true }));
          clients.push(ws);
          console.log('User logged in. Total connected:', clients.length);
        } else {
          ws.send(JSON.stringify({ type: 'login', success: false, message: 'Password salah' }));
          ws.close();
        }
        return;
      }

      if (!ws.isAuthorized) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }));
        return;
      }

      if (data.type === 'message') {
        clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.isAuthorized) {
            client.send(JSON.stringify({ type: 'message', text: data.text }));
          }
        });
      }
    } catch (err) {
      console.error('Invalid message format', err);
    }
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    console.log('User disconnected. Total:', clients.length);
  });
});

console.log('Server started');
