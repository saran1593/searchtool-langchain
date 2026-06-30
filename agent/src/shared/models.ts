import { env } from "./env";
import {ChatOpenAI} from "@langchain/openai";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {ChatGroq} from "@langchain/groq";
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';


type ModelOpts= {
    temperature?:number;
    maxTokens?:number;
};
export function createModel(opts:ModelOpts):BaseChatModel{

    const temp= opts.temperature ?? 0.2;
    switch(env.MODEL_PROVIDER){
        case 'gemini':
            return new ChatGoogleGenerativeAI({
                apiKey:env.GOOGLE_API_KEY,
                model:env.GEMINI_MODEL,
                temperature:temp
            });
        case 'openai':
            return new ChatOpenAI({
                apiKey:env.OPENAI_API_KEY,
                model:env.OPENAI_MODEL,
                temperature:temp
            });
        case 'groq':
            return new ChatGroq({
                apiKey:env.GROQ_API_KEY,
                model:env.GROQ_MODEL,
                temperature:temp
            });
        default:
            throw new Error(`Unknown model provider: ${env.MODEL_PROVIDER}`);
    }

}