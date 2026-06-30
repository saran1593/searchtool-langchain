import { SummarizeInputSchema, SummarizeOutputSchema } from "./schemas";
import {createModel} from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function Summarize(text: string){
    const {text: raw} = SummarizeInputSchema.parse({text});
    const clipped= clip(raw,4000);
const model = createModel({temperature:0.2})
const res= await model.invoke([
    new SystemMessage([
        "you are s helpful assisstant that writes short, accurate summaries",
        "Guidance:",
        "- Be factual and neutral, avoid marketing language.",
        "- Five to eight sentences;",
        "- Do not invent sources; you only summarize the provided text.",
        "- Keep it readable for beginners"
    ].join("\n")),

    new HumanMessage([
        "Summarize the followinf content for a beginner friendly audience",
        "Focus on the key facts and avoid fluff",
        `TEXT: ${clipped}`
    ].join("\n"))
])
const rawModelOutput= typeof res.content === 'string' ? res.content : String(res.content)  
const summary = normalizeSummary(rawModelOutput);

const output = SummarizeOutputSchema.parse({text:summary});
return output;

}

function normalizeSummary(s:string){
    const t = s
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
    return t.slice(0,2500);
}

function clip(s:string, max:number){
    return s.length > max ? s.slice(0,max):s
}