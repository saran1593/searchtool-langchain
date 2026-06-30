import { RunnableLambda,RunnableSequence } from "@langchain/core/runnables";
import { webSearch } from "../utils/webSearch";
import { openUrl } from "../utils/openUrl";
import { Summarize } from "../utils/summarize";
import { candidate } from "./types";
import { createModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const setTopResults = 5;

export const webSearchStop = RunnableLambda.from(
    async (input: { q: string; mode: 'web' | 'direct'; }) => {
        const results = await webSearch(input.q);
        return {
            ...input,
            results,
        };
    }
);

export const openAndSummarizeStep = RunnableLambda.from(
    async (input: { q: string; mode: 'web' | 'direct'; results: any[] }) => {
        if (!Array.isArray(input.results) || input.results.length === 0) {
            return {
                ...input,
                pageSummaries: [],
                fallback: 'no-results' as const
            };
        }
        const extractTopResults = input.results.slice(0, setTopResults);
        const settledResults = await Promise.allSettled(
            extractTopResults.map(async (result: any) => {
                const opened = await openUrl(result.url);
                const summarized = await Summarize(opened.content);

                return {
                    url: opened.url,
                    summary: summarized.text
                }
            })
        );

        const settledResultsPageSummaries = settledResults.filter(
            (r): r is PromiseFulfilledResult<{ url: string; summary: string }> => r.status === 'fulfilled'
        ).map(s => s.value);

        settledResults.forEach((res, index) => {
            if (res.status === 'rejected') {
                console.error(`Result at index ${index} (${extractTopResults[index]?.url}) rejected:`, res.reason);
            }
        });

        if (settledResultsPageSummaries.length === 0) {
            const fallbackSummaries = extractTopResults.map((result: any) => ({
                url: result.url,
                summary: String(result.snippet || result.title || "").trim(),
            })).filter((x: any) => x.summary.length > 0)
            return {
                ...input,
                pageSummaries: fallbackSummaries,
                fallback: 'snippets' as const
            }
        }

        return {
            ...input,
            pageSummaries: settledResultsPageSummaries,
            fallback: 'none' as const
        }
    }
)
export const stepCompose = RunnableLambda.from(
    async (input: {
        q: string;
        pageSummaries: Array<{ url: string; summary: string; }>;
        mode: 'web' | 'direct';
        fallback: 'no-results' | 'snippets' | 'none';
    }): Promise<candidate> => {
        const model = createModel({ temperature: 0.2 });
        if (!input.pageSummaries || input.pageSummaries.length === 0) {
            const directResponseFrommodel = await model.invoke([
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

            const directAns = (
                typeof directResponseFrommodel.content === "string"
                    ? directResponseFrommodel.content
                    : String(directResponseFrommodel.content)
            ).trim();

            return {
                answer: directAns,
                sources: [],
                mode: input.mode
            }
        }

        const webAnswerFromModel = await model.invoke([
            new SystemMessage(
                [
                    "You concisely answer question using provided page summaries",
                    "Rule: -",
                    "Be acurate and neutral",
                    "answer for beginners",
                    "If unsure, say you dont know",
                    "Do not repeat yourself or add filler words",
                    "Use only provided summaries, do not invent information",
                ].join('\n')
            ),
            new HumanMessage(
                [
                    `Question: ${input.q}`,
                    "summaries:",
                    JSON.stringify(input.pageSummaries, null, 2)
                ].join('\n')
            )
        ])

        const finalAnswer = (
            typeof webAnswerFromModel.content === "string"
                ? webAnswerFromModel.content
                : String(webAnswerFromModel.content)
        ).trim();
        const extractSources = input.pageSummaries.map(p => p.url)

        return {
            answer: finalAnswer,
            sources: extractSources,
            mode: 'web'
        }
    }
)

export const webBasedPath = RunnableSequence.from([
    webSearchStop,
    openAndSummarizeStep,
    stepCompose
])
