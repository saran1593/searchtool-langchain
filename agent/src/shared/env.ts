import {z} from "zod";

const EnvSchema =z.object({
    PORT: z.string().default("5000"),
    TAVILY_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    GOOGLE_API_KEY: z.string(),
    GROQ_API_KEY: z.string(),
    MODEL_PROVIDER: z.enum(['openai','gemini','groq']).default("gemini"),
    PROVIDER: z.string().default("gemini"),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
    GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
    SEARCH_PROVIDER: z.string().default("tavily"),
    ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000")
});

export const env = EnvSchema.parse(process.env);