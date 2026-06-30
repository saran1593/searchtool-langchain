import { convert } from 'html-to-text';
import { OpenUrlOutputSchema } from './schemas';

 
function validateUrl(url: string){
    try{
        const parsed = new URL(url);
        if (!/^https?:$/i.test(parsed.protocol)){
            throw new Error("Invalid url protocol");
        };
        return parsed.toString();

    }
    catch(err: any){
        throw new Error(`Invalid URL: ${url} (Error: ${err?.message || err})`);
    }
}
function collapseWhitespace(text: string){
    return text.replace(/\s+/g," ").trim();
}
export async function openUrl(url: string){
    const normalized = validateUrl(url);
    const res = await fetch(normalized,{
        headers:{
            'User-Agent': 'agent-core/1.0 (+course-demo)'
        }
    })
    if (!res.ok){
        throw new Error(`Failed to fetch: ${res.statusText}`);
    }

    const contentType= res.headers.get('content-type') || '';
    const raw = await res.text();
    const text = contentType.includes('text/html') ?
    convert(raw, {
        wordwrap: false,
        selectors:[
            {
                selector: 'nav', format: 'skip'
            },
            {
                selector: 'footer', format: 'skip'
            },
            {
                selector: 'header', format: 'skip'
            },
            {
                selector: 'script', format: 'skip'
            },
            {
                selector: 'style', format: 'skip'
            }
        ]
    })
    : raw;

    const clean = collapseWhitespace(text);
    const capped = clean.slice(0,8000);
    return OpenUrlOutputSchema.parse({
        url:normalized,
        content:capped
    });
}