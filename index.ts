import { handleChatRoute } from "./src/routes/chat";
import { landingPageHtml } from "./src/routes/landing";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();

    console.log(
      `[http][${requestId}] -> ${req.method} ${url.pathname}${url.search}`,
    );

    if (req.method === "GET" && url.pathname === "/health") {
      console.log(`[http][${requestId}] <- 200 /health`);
      return Response.json({ status: "ok" });
    }

    if (req.method === "GET" && url.pathname === "/") {
      console.log(`[http][${requestId}] <- 200 /`);
      return new Response(landingPageHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    if (req.method === "POST" && url.pathname === "/chat") {
      const response = await handleChatRoute(req, requestId);
      console.log(
        `[http][${requestId}] <- ${response.status} /chat (${Date.now() - startedAt}ms)`,
      );
      return response;
    }

    console.log(`[http][${requestId}] <- 404 ${url.pathname}`);
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`API escuchando en http://localhost:${server.port}`);
