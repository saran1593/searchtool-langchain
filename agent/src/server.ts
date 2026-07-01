import "dotenv/config";
import express from "express";
import cors from "cors";
import { SearchRouter } from "./routes/search_lcel";
import { kbRouter } from "./routes/light_rag_KB";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api',SearchRouter);
app.use('/kb',kbRouter);

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});