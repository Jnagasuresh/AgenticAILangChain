import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

// Word docs
const DocxPaths =[
    "C:\\src\\docs\\nike-growth-story.docx"
];

// PDF docs
const pdfPaths =[
    "C:\\src\\docs\\nke-10k-2023.pdf",
    "C:\\src\\docs\\Nike-Inc-2025_10K.pdf",
    "C:\\src\\docs\\nike-growth-story.pdf"
];


const allDocs=[];

// looping thrugh the docx paths and loading the documents using the DocxLoader from the Langchain library. The DocxLoader is a utility that allows you to easily extract text from Word documents, which can then be used for various applications such as document analysis, information retrieval, or feeding into a language model for further processing.
for(const path of DocxPaths){
    const loader = new DocxLoader(path);
    const docs = await loader.load();
    allDocs.push(...docs);
}

// looping through the PDF paths and loading the documents using the PDFLoader from the Langchain library. The PDFLoader is a utility that allows you to easily extract text from PDF files, which can then be used for various applications such as document analysis, information retrieval, or feeding into a language model for further processing.
// for(const path of pdfPaths){
//     const loader = new PDFLoader(path);
//     const docs = await loader.load();
//     allDocs.push(...docs);
// }


const textSplitter = new RecursiveCharacterTextSplitter({
	chunkSize: 1000,
	chunkOverlap: 200,
});

const allSplits = await textSplitter.splitDocuments(allDocs);
console.log(allSplits.length);

// declare the embeddings and vector store to store the document chunks and their embeddings. Here we are using the OpenAIEmbeddings model to generate embeddings for the document chunks and a simple in-memory vector store to store them. In a real implementation, you would likely want to use a more robust vector store such as Pinecone, Weaviate, or FAISS for better performance and scalability.
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small"
});

// Memory Vector Store is a simple in-memory vector store that allows you to store and retrieve document chunks based on their embeddings. It provides a similarity search function that can be used to find the most relevant document chunks for a given query based on cosine similarity of the embeddings. In this example, we are adding the document chunks to the vector store and then performing a similarity search with a sample query to retrieve the most relevant chunks from the PDF document.
const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(allSplits);

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
    messages: [{ role: "user", content: "What are the key highlights of Nike's growth story?" }]
});

console.log(response);

/* 
response from above code execution:
 "content": "Nike's growth story includes several key highlights:\n\n1. Financial Growth: From FY05 to the end of FY09, 
 Nike achieved an average of 9% growth in revenue, 12% growth in earnings per share (EPS), and a 60% increase in stock 
 price, despite the S&P 500 averaging a decline of 18% during this period.\n\n2. Strong Brand and Industry Leadership: 
 Nike has established itself as a strong and competitive leader in the athletic industry. 
 The company excels across various dimensions, including geographic reach, product type, and especially 
 sport performance categories.\n\n3. Innovation and Product Excellence: Innovation drives Nike's success, with a focus on
  creating great products and seizing opportunities to increase competitive separation.\n\n4. Legacy and Vision: Founded by 
  Bill Bowerman and Phil Knight, Nike started from a handshake agreement to improve athletic footwear. 
  Their vision led to the company becoming a leading innovator in athletic footwear, apparel, equipment, 
 and accessories, while also pushing the limits of sports performance and providing value to shareholders.",
*/