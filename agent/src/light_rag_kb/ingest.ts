import { chunkText } from "./chunk";
import { addChunks } from "./store";



export type IngestTextInput = {
    text: string;
    source?: string;
}

export async function ingestText(input: IngestTextInput) {
    const raw = (input.text ?? "").trim();
    if (!raw.length) {
        throw new Error('Input text is empty')
    }
    const source= input.source ?? "pasted-text";
    const docs = chunkText(raw,source);
    const chunkCount = await addChunks(docs);
    return {
        docCount: 1,
        chunkCount,
        source
    }
}