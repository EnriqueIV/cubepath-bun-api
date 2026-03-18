export const landingPageHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CubePath API Tester</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #0f1115;
        --panel: #171a21;
        --text: #e7eaf0;
        --muted: #a5adbb;
        --accent: #6ea8fe;
        --border: #2b3240;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.45;
      }

      main {
        max-width: 760px;
        margin: 48px auto;
        padding: 0 20px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 18px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 1.5rem;
      }

      p {
        margin: 0 0 16px;
        color: var(--muted);
      }

      label {
        display: block;
        margin: 12px 0 6px;
        font-size: 0.92rem;
        color: var(--muted);
      }

      input,
      textarea,
      button {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: #0e1218;
        color: var(--text);
        padding: 10px 12px;
        font: inherit;
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      button {
        margin-top: 14px;
        background: var(--accent);
        color: #081321;
        font-weight: 600;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.65;
        cursor: wait;
      }

      .result {
        margin-top: 16px;
        white-space: pre-wrap;
        word-break: break-word;
        border: 1px solid var(--border);
        border-radius: 10px;
        min-height: 160px;
        padding: 12px;
        background: #0b0f14;
      }

      .tiny {
        margin-top: 12px;
        font-size: 0.85rem;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <h1>CubePath API</h1>
        <p>Prueba el endpoint <code>POST /chat</code> desde esta página.</p>

        <form id="chat-form">
          <label for="model">Modelo</label>
          <input id="model" name="model" value="openrouter/free" />

          <label for="message">Mensaje</label>
          <textarea id="message" name="message" placeholder="Escribe una pregunta..."></textarea>

          <button id="send" type="submit">Enviar</button>
        </form>

        <div id="result" class="result">Esperando mensaje...</div>
        <div id="meta" class="tiny"></div>
      </section>
    </main>

    <script>
      const form = document.getElementById("chat-form");
      const send = document.getElementById("send");
      const result = document.getElementById("result");
      const meta = document.getElementById("meta");

      function setLoading(isLoading) {
        send.disabled = isLoading;
        send.textContent = isLoading ? "Enviando..." : "Enviar";
      }

      function updateMeta(text) {
        meta.textContent = text;
      }

      function parseSseChunk(buffer, onEvent) {
        const blocks = buffer.split("\\n\\n");
        const completeBlocks = blocks.slice(0, -1);
        const rest = blocks[blocks.length - 1] ?? "";

        for (const block of completeBlocks) {
          const lines = block.split("\\n");
          let eventName = "message";
          let dataText = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataText += line.slice(5).trim();
            }
          }

          if (!dataText) continue;

          try {
            onEvent(eventName, JSON.parse(dataText));
          } catch {
            onEvent("error", { error: "No se pudo parsear un evento SSE" });
          }
        }

        return rest;
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const model = document.getElementById("model").value.trim() || "openrouter/free";
        const message = document.getElementById("message").value.trim();

        if (!message) {
          result.textContent = "Escribe un mensaje para probar la API.";
          return;
        }

        result.textContent = "";
        updateMeta("Conectando...");
        setLoading(true);

        try {
          const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, message }),
          });

          if (!response.ok || !response.body) {
            const text = await response.text();
            throw new Error(text || "La API devolvio un error");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });

            sseBuffer = parseSseChunk(sseBuffer, (eventName, data) => {
              if (eventName === "meta") {
                updateMeta(
                  "requestId: " + (data.requestId ?? "-") + " | model: " + (data.model ?? model),
                );
              }

              if (eventName === "delta" && data.content) {
                result.textContent += data.content;
              }

              if (eventName === "usage" && data.reasoningTokens !== undefined) {
                updateMeta(meta.textContent + " | reasoningTokens: " + data.reasoningTokens);
              }

              if (eventName === "error") {
                result.textContent += "\\n\\n[error] " + (data.error ?? "Error de streaming");
                if (data.details) result.textContent += "\\n" + data.details;
              }

              if (eventName === "done") {
                updateMeta(
                  (meta.textContent || "") +
                    " | chunks: " +
                    (data.chunkCount ?? "-") +
                    " | " +
                    (data.elapsedMs ?? "-") +
                    "ms",
                );
              }
            });
          }
        } catch (error) {
          result.textContent =
            error instanceof Error ? error.message : "Error inesperado al llamar a /chat";
          updateMeta("Fallo al conectar");
        } finally {
          setLoading(false);
        }
      });
    </script>
  </body>
</html>
`;
