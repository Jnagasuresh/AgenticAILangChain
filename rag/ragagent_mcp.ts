
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, tool } from "langchain";
import z from "zod";


const pdfPaths = [
    "C:\\src\\docs\\nke-10k-2023.pdf",
    "C:\\src\\docs\\Nike-Inc-2025_10K.pdf",
    "C:\\src\\docs\\nike-growth-story.pdf"
];

const allDocs = [];
for (const path of pdfPaths) {
    const loader = new PDFLoader(path);
    const docs = await loader.load();
    allDocs.push(...docs);
}


const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const alldocs = await textSplitter.splitDocuments(allDocs);
console.log(alldocs.length);

// declare the embeddings and vector store to store the document chunks and their embeddings. Here we are using the OpenAIEmbeddings model to generate embeddings for the document chunks and a simple in-memory vector store to store them. In a real implementation, you would likely want to use a more robust vector store such as Pinecone, Weaviate, or FAISS for better performance and scalability.
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small"
});

// Memory Vector Store is a simple in-memory vector store that allows you to store and retrieve document chunks based on their embeddings. It provides a similarity search function that can be used to find the most relevant document chunks for a given query based on cosine similarity of the embeddings. In this example, we are adding the document chunks to the vector store and then performing a similarity search with a sample query to retrieve the most relevant chunks from the PDF document.
const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(alldocs);


const client = new MultiServerMCPClient({
    ecommerce: {
        transport: "stdio",
        command: "node",
        args: ["C:\\src\\PlayGround\\mcp-ecommerce-crud\\dist\\mcp\\server.js"]
    }
});


const mcpTools = await client.getTools();


const retrieve = tool(async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const docsContent = retrievedDocs.map((doc) => doc.pageContent
    ).join("\n\n");
    return docsContent;
},
    {
        name: "retrieve",
        description: "Retrieve information from multiple pdf documents",
        schema: z.object({
            query: z.string()
        })

    }

);

const agent = createAgent({
    model: "gpt-4o",    
    tools: [retrieve,...mcpTools]
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "Get Product with id 28 and check if that product name matches with our company's offerings." }]
});

console.log(response);