import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


// This file demonstrates how to use the PDFLoader from the Langchain library to load and read the contents of a PDF document.
// The PDFLoader is a utility that allows you to easily extract text from PDF files, which can then be used for various applications such as document analysis, information retrieval, or feeding into a language model for further processing.
const loader = new PDFLoader("C:\\src\\docs\\nke-10k-2023.pdf");
const docs = await loader.load();

console.log(docs.length);
console.log(docs[0].pageContent);


const textSplitter = new RecursiveCharacterTextSplitter({
	chunkSize: 1000,
	chunkOverlap: 200,
});

const alldocs = await textSplitter.splitDocuments(docs);
console.log(alldocs.length);

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small"
});