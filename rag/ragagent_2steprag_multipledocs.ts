import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

// This file demonstrates how to use the PDFLoader from the Langchain library to load and read the contents of a PDF document.
// The PDFLoader is a utility that allows you to easily extract text from PDF files, which can then be used for various applications such as document analysis, information retrieval, or feeding into a language model for further processing.

const pdfPaths =[
    "C:\\src\\docs\\nke-10k-2023.pdf",
    "C:\\src\\docs\\Nike-Inc-2025_10K.pdf",
    "C:\\src\\docs\\nike-growth-story.pdf"
];

const allDocs=[];
for(const path of pdfPaths){
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

const ragMiddleware = dynamicSystemPromptMiddleware(async (state) =>{
    const userMessage = state.messages[0].content;
    const query = typeof userMessage === "string" ? userMessage : "";
    const reretrivedResults = await vectorStore.similaritySearch(query,2);
    const docsContent = reretrivedResults.map(result => result.pageContent).join("\n");
    
    const systemPrompt = `You are a helpful assistant that provides information based on the 
    contents of a PDF document about Nike's financial performance. Use the following context from the document to answer the 
    user's query:\n\n${docsContent}`;
    return systemPrompt;
});

const agent = createAgent({
    model: "gpt-4o",
    systemPrompt: "You are a helpful assistant that provides information based on the contents of a PDF document about Nike's financial performance. Use the tools at your disposal to retrieve relevant information from the document and provide accurate and concise answers to the user's queries.",
    tools: [],
    middleware: [ragMiddleware]
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "What was the revenue of Nike in 2023 & 2025 and from which town nike has grown into world famous footware?" }]
});

console.log(response);
