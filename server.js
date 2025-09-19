const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const PASSWORD = "chat123"; // password login

// Buat server WebSocket
const wss = new WebSocket.Server({ port: PORT });

let clients = [];

wss.on("connection", (ws) => {
  ws.isAuthorized = false;
  console.log("🔗 Client mencoba terhubung...");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // === LOGIN ===
      if (data.type === "login") {
        if (data.password === PASSWORD) {
          ws.isAuthorized = true;
          ws.send(JSON.stringify({ type: "login", success: true }));
          if (!clients.includes(ws)) clients.push(ws);
          console.log("✅ User logged in. Total connected:", clients.length);
        } else {
          ws.send(JSON.stringify({ type: "login", success: false, message: "Password salah" }));
          ws.close();
        }
        return;
      }

      // === CEK AUTH ===
      if (!ws.isAuthorized) {
        ws.send(JSON.stringify({ type: "error", message: "Not authorized" }));
        return;
      }

      // === BROADCAST PESAN ===
      if (data.type === "message" && data.text) {
        console.log("📩 Pesan diterima:", data.text);
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.isAuthorized) {
            client.send(JSON.stringify({ type: "message", text: data.text }));
          }
        });
      }
    } catch (err) {
      console.error("❌ Invalid message format:", err.message);
      ws.send(JSON.stringify({ type: "error", message: "Invalid format, use JSON" }));
    }
  });

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log("❌ User disconnected. Total:", clients.length);
  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err.message);
  });
});

console.log(`🚀 WebSocket server running on port ${PORT}`);
