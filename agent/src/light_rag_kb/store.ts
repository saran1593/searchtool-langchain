import {OpenAIEmbeddings} from '@langchain/openai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import {TaskType} from '@google/generative-ai'
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { Document } from '@langchain/core/documents';

type Provider = "openai" | "google"

function getProvider(): Provider{
    const p = (process.env.RAG_MODEL_PROVIDER ?? "gemini") .toLowerCase();
    return p === "gemini" ? "google" : "openai"
}
function makeOpenAiEmbeddings(){
    const key = process.env.OPENAI_API_KEY ?? ''
    if (!key){
        throw new Error("OPENAI_API_KEY is not set")
    }
    return new OpenAIEmbeddings({
        apiKey:key,
        model: process.env.OPENAI_MODEL || "text-embedding-ada-002",
    })
}

function makeGoogleEmbeddings (){
    const key = process.env.GOOGLE_API_KEY ?? ""
    if (!key){
        throw new Error("GOOGLE_API_KEY is not set")
    }
    return new GoogleGenerativeAIEmbeddings({
        model:'gemini-embedding-001',
        apiKey:key,
        taskType: TaskType.RETRIEVAL_DOCUMENT
    })
}

function makeEmbeddings(provider:Provider){
    return provider === "google" ? makeGoogleEmbeddings() : makeOpenAiEmbeddings();
}

let store: MemoryVectorStore | null = null;
let currentSetProvider : Provider | null = null;

export function getVectorStore() :MemoryVectorStore{
    const provider = getProvider();
    if (store && currentSetProvider === provider){
        return store;
    }
    store = new MemoryVectorStore(makeEmbeddings(provider))
    currentSetProvider = provider;
    return store;
}
export async function addChunks(docs: Document[]) : Promise<number>{
    if (!Array.isArray(docs) || !docs.length) return 0;
    const store = getVectorStore();
    await store.addDocuments(docs);
    return docs.length;
}

export function resetStore(){
    store = null;
    currentSetProvider = null;
}