import "dotenv/config";
import express from "express";
import cors from "cors";
import { SearchRouter } from "./routes/search_lcel";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api',SearchRouter);

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});