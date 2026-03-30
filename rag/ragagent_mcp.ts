import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent, tool } from "langchain";
import z from "zod";
import { BaseRagAgent } from "./ragagent_base";
import "dotenv/config";


export class MCPAgent extends BaseRagAgent {
    constructor(pdfPaths: string[]) {
        super(pdfPaths);
    }

    async run(query: string) {
        if (!this.vectorStore) {
            await this.initVectorStore();
        }

        const client = new MultiServerMCPClient({
            ecommerce: {
                transport: "stdio",
                command: "node",
                //args: [process.env.MCP_SERVER_PATH || ""]
                args: ["C:\\src\\PlayGround\\mcp-ecommerce-crud\\dist\\mcp\\server.js"]
            }
        });

        const mcpTools = await client.getTools();

        const retrieve = tool(async ({ query }) => {
            if (!this.vectorStore) {
                throw new Error("Vector store not initialized");
            }
            const retrievedDocs = await this.vectorStore.similaritySearch(query, 2);
            const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
            return docsContent;
        }, {
            name: "retrieve",
            description: "Retrieve information from multiple pdf documents",
            schema: z.object({
                query: z.string()
            })
        });

        const agent = createAgent({
            model: "gpt-4o",
            tools: [...mcpTools, retrieve] as any
        });

        const response = await agent.invoke({
            messages: [{ role: "user", content: query }]
        });

        console.log(response);
    }
}

const pdfPaths = [
    "./docs/nke-10k-2023.pdf",
    //"C:\\src\\docs\\Nike-Inc-2025_10K.pdf",
    "./docs/nike-growth-story.pdf"
];

const agent = new MCPAgent(pdfPaths);
await agent.run("Get Product with id 28 and check if that product name matches with our company's offerings.");
