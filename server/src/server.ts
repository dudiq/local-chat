import {serve} from "bun";
import {cleanupRooms} from "./interface/cleanup-rooms";
import {routeSse} from "./routes/route.sse";
import {routeSend} from "./routes/route.send";

cleanupRooms()

const server = serve({
  port: 3000,
  idleTimeout: 0,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. SSE Endpoint: Connect to room
    if (url.pathname === "/api/sse") {
      return routeSse(req)
    }

    // 2. POST Endpoint
    if (url.pathname === "/api/send" && req.method === "POST") {
      return routeSend(req)
    }

    // 3. static
    const buildPath = "./public";
    let filePath = url.pathname;
    if (filePath === "/") filePath = "/index.html";

    const file = Bun.file(`${buildPath}${filePath}`);
    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback SPA
    return new Response(Bun.file(`${buildPath}/index.html`));
  },
});

console.log(`Server running on http://localhost:${server.port}`);
