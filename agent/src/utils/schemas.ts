import {z} from "zod";

export const WebSearchResultSchema = z.object({
    title: z.string().min(1),
    url:z.string().url(),
    snippet: z.string().optional().default("")
});

export const WebSearchResultsSchema = z.array(WebSearchResultSchema).max(10);

export type WebSearchResult = z.infer<typeof WebSearchResultsSchema>;

export const OpenUrlInputSchema = z.object({
    url: z.string().url()
});

export const OpenUrlOutputSchema = z.object({
    url: z.string().url(),
    content: z.string().min(1)
});

export type OpenUrlInput = z.infer<typeof OpenUrlInputSchema>;
export type OpenUrlOutput = z.infer<typeof OpenUrlOutputSchema>;

export const SummarizeInputSchema= z.object({
    text: z.string().min(50)
});
export const SummarizeOutputSchema= z.object({
    text: z.string().min(1)
});

export const SearchInputSchema = z.object({
    q: z.string().min(5)
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

export const SearchAnswerSchema = z.object({
    answer:z.string().min(1),
    sources:z.array(z.string().url()).default([])
});

export type SearchAnswer = z.infer<typeof SearchAnswerSchema>;