import { db } from "./db/db.ts";

const port = 8080;
const conn = Deno.listen({ port });
console.log(`WebSocket server is running on ws://localhost:${port}`);

// Keep track of all connected sockets
let sockets: WebSocket[] = [];

for await (const httpConn of conn) {
  (async () => {
    const httpRequests = Deno.serveHttp(httpConn);
    for await (const e of httpRequests) {
      if (e) {
        const { socket, response } = Deno.upgradeWebSocket(e.request);
        sockets.push(socket);

        socket.onopen = async () => {
          console.log("A WebSocket connection has been opened.");
        };

        socket.onmessage = async (e) => {
          console.log("Received message:", e.data);

          // DBに保存
          try {
            const messageData = JSON.parse(e.data);
            console.log(messageData);
            const roomId = messageData.roomId as string;
            const userId = messageData.userId as string;
            const userName = messageData.userName as string;
            const message = messageData.message as string;

            await db.execute(
              "INSERT INTO messages (room_id, user_id, message_text) VALUES (?, ?, ?)",
              [roomId, userId, message]
            );
          } catch (e) {
            console.error("Database error: ", e);
          }

          // Send the message to all connected clients
          sockets.forEach((socket: WebSocket) => {
            socket.send(e.data);
          });
        };

        socket.onclose = () => {
          console.log("WebSocket has been closed.");

          // Remove the socket from the array
          sockets = sockets.filter((s) => s !== socket);
        };

        socket.onerror = (e) => {
          console.error("WebSocket error:", e);
        };

        e.respondWith(response);
      }
    }
  })();
}
