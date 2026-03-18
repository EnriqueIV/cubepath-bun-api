import { OpenRouter } from "@openrouter/sdk";
import { env } from "../config/env";

const maskedApiKey =
  env.OPENROUTER_API_KEY.length > 10
    ? `${env.OPENROUTER_API_KEY.slice(0, 6)}...${env.OPENROUTER_API_KEY.slice(-4)}`
    : "***";

console.log("[openrouter] Inicializando cliente OpenRouter");
console.log(`[openrouter] API key detectada: ${maskedApiKey}`);

export const openrouter = new OpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

console.log("[openrouter] Cliente OpenRouter listo");
