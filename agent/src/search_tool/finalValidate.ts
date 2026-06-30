import { RunnableLambda } from "@langchain/core/runnables";
import { candidate } from "./types";
import { SearchAnswerSchema } from "../utils/schemas";
import { createModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
export const finalValidation = RunnableLambda.from(
    async( candidate: candidate) =>{
        const finalDraft = {
            answer: candidate.answer,
            sources:candidate.sources ?? []
        }

        const parsed1 = SearchAnswerSchema.safeParse(finalDraft)
        if(parsed1.success){
            return parsed1.data       
        }
        const repaired= await repairSearchAns(finalDraft);
        const parsed2 = SearchAnswerSchema.safeParse(repaired);
        if(parsed2.success){
            return parsed2.data;
        }
        throw new Error("Failed to repair the search answer");
    }
)

async function repairSearchAns(obj: any): Promise<{answer: string; sources: string[]}>{
    const model = createModel({temperature:0.2});
    const response = await model.invoke(
        [
            new SystemMessage([
                "you fix the json object to match the given schema",
                "Respond only with valid json object",
                "Schema: {answer: string; sources: string[] (url as strings)}"
            ].join('\n')
        ),
        new HumanMessage(
            [
                `input: ${JSON.stringify(obj)}`,
                "return corrected object",
                "Do not repeat or explain",
                "Return only json"
            ].join('\n')
        )
        ]
    )
    const text = typeof response.content === "string" ? response.content : String(response.content)
    const json = extractJson(text);
    return {
        answer: String(json?.answer ?? "").trim(),
        sources: Array.isArray(json?.sources)
            ? json.sources.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0)
            : []
    };

}

function extractJson(input: string){
    const start = input.indexOf("{");
    const end = input.lastIndexOf("}");
    
    if(start === -1 || end === -1 || end < start){
        throw new Error("No valid JSON object found in the input");
    }
    
    const jsonStr = input.slice(start, end + 1);
    
    try {
        return JSON.parse(jsonStr);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error}`);
    }
}