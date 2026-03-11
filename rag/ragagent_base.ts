import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

export abstract class BaseRagAgent {
    protected pdfPaths: string[];
    protected vectorStore: MemoryVectorStore | null = null;
    protected embeddings: OpenAIEmbeddings;

    constructor(pdfPaths: string[]) {
        this.pdfPaths = pdfPaths;
        this.embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small"
        });
    }

    async initVectorStore() {
        const allDocs = [];
        for (const path of this.pdfPaths) {
            const loader = new PDFLoader(path);
            const docs = await loader.load();
            allDocs.push(...docs);
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = await textSplitter.splitDocuments(allDocs);
        console.log(`Loaded ${splitDocs.length} chunks from ${this.pdfPaths.length} documents.`);

        this.vectorStore = new MemoryVectorStore(this.embeddings);
        await this.vectorStore.addDocuments(splitDocs);
    }

    abstract run(query: string): Promise<void>;
}
