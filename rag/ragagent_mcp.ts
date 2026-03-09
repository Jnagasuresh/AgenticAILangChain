
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";


const client = new MultiServerMCPClient({
    ecommerce:{
        transport: "stdio",
        command: "node",
        args: ["C:\\src\\PlayGround\\mcp-ecommerce-crud\\dist\\mcp\\server.js"]
    }
});


const mcpTools = await client.getTools();


const agent = createAgent({
    model: "gpt-4o",
    systemPrompt: "You are a helpful assistant that provides information based on the contents of a PDF document about Nike's financial performance. Use the tools at your disposal to retrieve relevant information from the document and provide accurate and concise answers to the user's queries.",
    tools: [...mcpTools],
    middleware: []
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "Get Product with id 10" }]
});

console.log(response);