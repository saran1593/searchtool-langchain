import "dotenv/config";
import { runSearch } from "../src/search_tool/searchChain";

async function main() {
    try {
        console.log("Running search...");
        const result = await runSearch({ q: "top 10 AI platforms for vibe coding" });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Error running search:", err);
    }
}

main();
