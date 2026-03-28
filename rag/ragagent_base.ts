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
        // Embeddings are a way to represent text data in a high-dimensional vector space, 
        // where semantically similar pieces of text are represented by vectors that are close to each other. 
        // In this implementation, we are using the OpenAIEmbeddings model to generate embeddings for the document chunks. 
        // The "text-embedding-3-small" model is a smaller version of OpenAI's embedding models that is designed for efficient generation of 
        // embeddings while still providing good performance for many applications. 
        // By generating embeddings for the document chunks and storing them in a vector store, we can perform similarity searches to retrieve relevant information based on user queries.
        this.embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small"
        });
    }

    async initVectorStore() {
        const allDocs = [];
        // Load the PDF documents specified in the pdfPaths array using the PDFLoader.
        for (const path of this.pdfPaths) {
            const loader = new PDFLoader(path);
            const docs = await loader.load();
            allDocs.push(...docs);
        }

        // Split the loaded documents into smaller chunks using the RecursiveCharacterTextSplitter. 
        // This is necessary because language models have a maximum token limit, and splitting the documents into 
        // smaller chunks allows us to fit more information into the context window of the model when performing retrieval.
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
