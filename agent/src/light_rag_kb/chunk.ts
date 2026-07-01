
import { Document } from '@langchain/core/documents';
export const CHUNK_SIZE = 1000;
export const OVERLAP = 150;

export function chunkText(text: string, source: string): Document[] {
    const clean = (text ?? "").replace(/\r\n/g, "\n");
    const docs: Document[] = [];
    if (!clean.trim()) return docs;
    const step = Math.max(1,CHUNK_SIZE-OVERLAP);
    let start = 0;
    let chunkid =0;
     while (start< clean.length){
      const end = Math.min(clean.length, start + CHUNK_SIZE)
      const slice = clean.slice(start,end).trim();
      if(slice.length>0){
        docs.push(
          new Document({
            pageContent:slice,
            metadata:{
              source:source,
              chunkId:chunkid
            }
          })
        )
      }
      chunkid++;
      start+=step;
     }
     return docs;
}