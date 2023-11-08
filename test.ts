// @deno-types="https://esm.sh/@planetscale/database/dist/index.d.ts"
import "https://deno.land/std/dotenv/load.ts";
import { connect } from "npm:@planetscale/database";

const config = {
  host: Deno.env.get("DATABASE_HOST"),
  username: Deno.env.get("DATABASE_USERNAME"),
  password: Deno.env.get("DATABASE_PASSWORD"),
};

const db = connect(config);

// server.ts
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

        socket.onmessage = (e) => {
          console.log("Received message:", e.data);

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
