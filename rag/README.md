# RAG (Retrieval-Augmented Generation) Agents Project

This project contains a collection of TypeScript files demonstrating various RAG (Retrieval-Augmented Generation) patterns and implementations using [LangChain](https://js.langchain.com/), OpenAI Embeddings, and MemoryVectorStore.

## Overview

The project showcases different ways to load, process, and query documents (PDFs and DOCX) to provide context for AI-driven responses. It also includes an example of integrating with the Model Context Protocol (MCP).

## Core Components

- **`ragagent_base.ts`**: An abstract base class (`BaseRagAgent`) that provides common functionality for RAG agents, including PDF loading, document splitting using `RecursiveCharacterTextSplitter`, and vector store initialization with OpenAI's `text-embedding-3-small` model.
- **`ragagent_mcp.ts`**: An implementation that extends `BaseRagAgent` and incorporates **Model Context Protocol (MCP)**. It combines a document retrieval tool with external MCP tools (e.g., an ecommerce CRUD server) to allow an agent to both query local documents and perform external actions.
- **`ragagent_2steprag.ts`**: Demonstrates a "2-step RAG" process. It uses `dynamicSystemPromptMiddleware` to perform a similarity search based on the user's initial query and then injects the retrieved context directly into the system prompt before the agent generates a response.
- **`ragagent_2steprag_docx.ts`**: Similar to the 2-step RAG implementation, but specifically configured to handle **DOCX** files using `DocxLoader`.
- **`ragagent_2steprag_multipledocs.ts`**: An implementation of the 2-step RAG pattern that supports loading and querying from **multiple PDF documents** simultaneously.
- **`ragagent_pdfchunks.ts`**: A simpler script that demonstrates the basic workflow of loading a PDF, splitting it into chunks, generating embeddings, and performing a manual similarity search or using a retriever.

## Tools & Technologies

- **LangChain**: The primary framework for building the RAG pipelines and agents.
- **OpenAI Embeddings**: Used for generating vector representations of document chunks.
- **MemoryVectorStore**: A simple, in-memory vector database for storing and searching document embeddings.
- **Model Context Protocol (MCP)**: Used in `ragagent_mcp.ts` to extend agent capabilities with external tools.

## Prerequisites

- Node.js and TypeScript installed.
- A `.env` file with necessary API keys (e.g., `OPENAI_API_KEY`).
- Document files (PDF/DOCX) located in the paths specified within each script (e.g., `C:\src\docs\`).
