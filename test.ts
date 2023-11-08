// server.ts
const port = 8080;
const conn = Deno.listen({ port });
console.log(`WebSocket server is running on ws://localhost:${port}`);

for await (const httpConn of conn) {
  (async () => {
    const httpRequests = Deno.serveHttp(httpConn);
    for await (const e of httpRequests) {
      if (e) {
        const { socket, response } = Deno.upgradeWebSocket(e.request);
        socket.onopen = () => {
          console.log("A WebSocket connection has been opened.");
        };

        socket.onmessage = (e) => {
          console.log("Received message:", e.data);
          // Echo the message back to the client
          socket.send(e.data);
        };

        socket.onclose = () => {
          console.log("WebSocket has been closed.");
        };

        socket.onerror = (e) => {
          console.error("WebSocket error:", e);
        };

        e.respondWith(response);
      }
    }
  })();
}
