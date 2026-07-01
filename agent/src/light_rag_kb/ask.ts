import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createModel } from "../shared/models";
import { getVectorStore } from "./store";


export type KBSource = {
    source: string;
    chunkId: number;
}

export type KBAskResult = {
    answer: string;
    sources: KBSource[];
    confidence: number;
}

function buildChunk(chunks: { text: string; meta: any }[]) {
    return chunks.map(({ text, meta }, i) => [
        `[${i + 1} ${String(meta?.source ?? "unknown")} #${String(meta?.chunkId ?? "?")}`,
        text ?? "Empty text"
    ].join("\n")).join("\n\n---\n\n")
}

async function buildFinalAnswerFromLLm(query: string, context: string) {
    const model = createModel({ temperature: 0.2 });
    const res = await model.invoke(
        [
            new SystemMessage([
                "You are a helpful assisstant that answers only using the provided context.",
                "If the answer is not in the context, say so briefly.",
                "Be concise (4-5 sentences), neutral, and avoid any marketing info.",
                "Do not fabricate sources or cite anything that is not in the context"
            ].join("\n")),

            new HumanMessage(
                [
                    `Question: ${query}\n\n`,
                    `Context:\n${context} (quoted chunks)`,
                    `Answer in plain language. Include numerical citations at the end of sentences if the context provides them. `
                ].join("/\n")
            )
        ]
    )
    const finalRes = typeof res.content === "string" ? res.content : String(res.content);

    return finalRes.trim().slice(0, 1500)
}
export async function askKB(query: string, k = 4): Promise<KBAskResult> {
    const validateCurrentQuery = (query ?? "").trim();

    if (!validateCurrentQuery) {
        throw new Error("Query is empty")
    }
    const store = getVectorStore();

    const embedQuery = await store.embeddings.embedQuery(validateCurrentQuery);
    const pairs = await store.similaritySearchVectorWithScore(embedQuery, k);

    const chunks = pairs.map(([doc]) => ({
        text: doc.pageContent || "",
        meta: doc.metadata || {}
    }))

    const score = pairs.map(([_, score]) => Number(score) || 0)
    const context = buildChunk(chunks)
    const answer = await buildFinalAnswerFromLLm(validateCurrentQuery, context)
    const sources: KBSource[] = chunks.map((c) => ({
        source: String(c.meta?.source ?? "unknown"),
        chunkId: Number(c.meta?.chunkId ?? 0)
    })
    )
    const confidence = buildConfidence(score);
    return {
        answer,
        sources,
        confidence
    }

}

function buildConfidence(scores: number[]): number {
    if (!scores.length) {
        return 0;
    }
    const clamped = scores.map(score => Math.max(0, Math.min(1, score)));
    const sum = clamped.reduce((a, b) => a + b, 0);
    return Math.round(sum * 100) / 100
}