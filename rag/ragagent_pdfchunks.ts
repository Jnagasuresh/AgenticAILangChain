import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

// This file demonstrates how to use the PDFLoader from the Langchain library to load and read the contents of a PDF document.
// The PDFLoader is a utility that allows you to easily extract text from PDF files, which can then be used for various applications such as document analysis, information retrieval, or feeding into a language model for further processing.
const loader = new PDFLoader("./docs/nke-10k-2023.pdf");
const docs = await loader.load();

console.log(docs.length);
// console.log(docs[0].pageContent);


const textSplitter = new RecursiveCharacterTextSplitter({
	chunkSize: 1000,
	chunkOverlap: 200,
});

const alldocs = await textSplitter.splitDocuments(docs);
console.log(alldocs.length);

// declare the embeddings and vector store to store the document chunks and their embeddings. Here we are using the OpenAIEmbeddings model to generate embeddings for the document chunks and a simple in-memory vector store to store them. In a real implementation, you would likely want to use a more robust vector store such as Pinecone, Weaviate, or FAISS for better performance and scalability.
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small"
});

// Memory Vector Store is a simple in-memory vector store that allows you to store and retrieve document chunks based on their embeddings. It provides a similarity search function that can be used to find the most relevant document chunks for a given query based on cosine similarity of the embeddings. In this example, we are adding the document chunks to the vector store and then performing a similarity search with a sample query to retrieve the most relevant chunks from the PDF document.
const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(alldocs);

const query = "when was NIKE incorporated?";
const results = await vectorStore.similaritySearch(query);
console.log(results);

const retriver = vectorStore.asRetriever({
    //searchType : "similarity",
    searchType : "mmr",
    searchKwargs : {
        fetchK: 1
    }
});