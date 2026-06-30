import { RunnableBranch, RunnableSequence } from "@langchain/core/runnables";
import {webBasedPath} from "./webPipeline";
import { directPath } from "./directPipeline";
import { routerStep } from "./routeStrategy";
import { finalValidation } from "./finalValidate";
import { SearchAnswer, SearchInput } from "../utils/schemas";


const branch = RunnableBranch.from<{q: string; mode: 'web'| 'direct'},any>(
    [
        [(input) => input.mode === 'web',
        webBasedPath],
        directPath
    ]
)

export const searchChain = RunnableSequence.from([
    routerStep,
    branch,
    finalValidation
])

export async function runSearch(input: SearchInput) {
    return await searchChain.invoke(input);
    
}