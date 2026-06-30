import { RunnableLambda } from "@langchain/core/runnables";
import { candidate } from "./types";
import { createModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";


export const directPath = RunnableLambda.from(
    async (input: { q: string; mode: 'web' | 'direct'; }): Promise<candidate> => {
        const model = createModel({ temperature: 0.2 });

        const res = await model.invoke([
            new SystemMessage(
                [
                    "You answer briefly and clearly for beginners",
                    "If unsure, say you dont know"
                ].join('\n')
            ),
            new HumanMessage(
                [
                    "Query: " + input.q,
                    "Answer based on your general knowledge"
                ].join('\n')
            )
        ])

        const finalAnswer = (
            typeof res.content === 'string'
                ? res.content
                : String(res.content)
        ).trim();
        return {
            answer:finalAnswer,
            sources:[],
            mode:'direct'
        }
    }
)