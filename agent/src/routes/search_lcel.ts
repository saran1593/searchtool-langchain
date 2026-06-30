import { Router } from "express";
import {  runSearch } from "../search_tool/searchChain";
import {  SearchInputSchema } from "../utils/schemas";

export const SearchRouter = Router();

SearchRouter.post('/search',async(req,res)=>{
    const body = SearchInputSchema.safeParse(req.body);
    if(!body.success){
        return res.status(400).json({error:body.error.message});
    }
    const input = body.data;
    try {
        const result = await runSearch(input);
        return res.json(result);
    } catch (error) {
        console.error("Error in search-lcel:", error);
        return res.status(500).json({ error: "Failed to run search" });
    }
});