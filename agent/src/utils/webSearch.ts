import {env} from "../shared/env";
import {WebSearchResultSchema, type WebSearchResult} from "./schemas";


export async function webSearch(q:string){
    const query = (q??"").trim();
    if(!query) throw new Error("Empty search query");
    return searchTavilyUtil(query);
}

async function searchTavilyUtil(query:string){
    if (!env.TAVILY_API_KEY) throw new Error("TAVILY_API_KEY missing");
    const result = await fetch("https://api.tavily.com/search",{
        method:"POST",
        headers:{
            "Authorization":env.TAVILY_API_KEY,
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            query:query,
            search_depth:"basic",
            max_results:5,
            include_answer:false,
            include_images:false
        })
    });
    if(!result.ok) throw new Error(`Tavily search failed: ${result.statusText}`);
    
    const data = await result.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const normalized = results.slice(0,5).map((r: any) => WebSearchResultSchema.parse({
        title: String(r.title ?? "").trim() || "Untitled",
        url: String(r.url ?? "").trim(),
        snippet: String(r.snippet ?? "").trim().slice(0,220)
    }));
    
    return normalized;
}