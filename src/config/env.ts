const openRouterApiKey = Bun.env.OPENROUTER_API_KEY;

if (!openRouterApiKey) {
  throw new Error("Falta OPENROUTER_API_KEY en variables de entorno");
}

export const env = {
  OPENROUTER_API_KEY: openRouterApiKey,
} as const;
