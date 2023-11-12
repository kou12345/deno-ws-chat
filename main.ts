import { db } from "./db/db.ts";

const port = 8080;
const conn = Deno.listen({ port });
console.log(`WebSocket server is running on ws://localhost:${port}`);

let sockets: WebSocket[] = [];
const roomClients = new Map<string, Set<WebSocket>>();

for await (const httpConn of conn) {
  (async () => {
    const httpRequests = Deno.serveHttp(httpConn);
    for await (const e of httpRequests) {
      if (e) {
        const { socket, response } = Deno.upgradeWebSocket(e.request);
        sockets.push(socket);

        socket.onopen = () => {
          console.log("A WebSocket connection has been opened.");
        };

        socket.onmessage = async (e) => {
          try {
            const messageData = JSON.parse(e.data);
            console.log("messageData: ", messageData);
            const messageType = messageData.type;
            console.log("messageType: ", messageType);
            const roomId = messageData.roomId as string;
            const userId = messageData.userId as string;
            const message = messageData.message as string;

            if (messageType === "joinRoom") {
              // ルームの参加処理
              if (!roomClients.has(roomId)) {
                roomClients.set(roomId, new Set());
              }
              roomClients.get(roomId)?.add(socket);
              console.log(`User ${userId} joined room ${roomId}`);
            } else if (messageType === "message") {
              // メッセージ送信処理
              await db.execute(
                "INSERT INTO messages (room_id, user_id, message_text) VALUES (?, ?, ?)",
                [roomId, userId, message]
              );

              // 特定のルームにのみメッセージを送信
              console.log(roomClients);
              roomClients.get(roomId)?.forEach((client) => {
                console.log(client);
                console.log("send");
                client.send(e.data);
              });
            }
          } catch (error) {
            console.error("Error: ", error);
          }
        };

        socket.onclose = () => {
          console.log("WebSocket has been closed.");
          sockets = sockets.filter((s) => s !== socket);
          // クライアントをすべてのルームから削除
          roomClients.forEach((clients) => {
            clients.delete(socket);
          });
        };

        socket.onerror = (e) => {
          console.error("WebSocket error:", e);
        };

        e.respondWith(response);
      }
    }
  })();
}
