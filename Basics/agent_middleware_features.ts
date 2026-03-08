import { createAgent, llmToolSelectorMiddleware, modelFallbackMiddleware, summarizationMiddleware, tool } from "langchain";
import z from "zod";


const searchTool = tool((query) => {
    // In a real implementation, you would replace this with an actual API call to a search service.
    return `Here are the search results for your query: ${query}`;
}
    , {
        name: "search",
        description: "Search for information on the internet based on a query.",
        schema: z.object({
            query: z.string().describe("The search query to find information on the internet.")
        })
    });

const emailTool = tool(({ recipient, subject }) => {
    // In a real implementation, you would replace this with an actual API call to an email service.
    return `You have 3 new emails in your inbox for recipient: ${recipient} with subject: ${subject}`;
}, {
    name: "check_email",
    description: "Check for new emails in the user's inbox.",
    schema: z.object({
        recipient: z.string().describe("The email address of the recipient."),
        subject: z.string().describe("The subject of the email to check for.")
    })
});


// Define a tool for getting the weather. This is a simple example, and you can customize it to fit your needs. The tool can be an API call, a database query, or any other function that provides useful information to the agent.
const getWether = tool((input) => {
    // In a real implementation, you would replace this with an actual API call to a weather service.

    return `The weather in ${input.city} is sunny with a high of 25°C.`;
}, {
    // tool metadata
    name: "get_Weather",
    description: "Get the current weather for a given city.",
    schema: z.object({
        city: z.string().describe("Get the weather for a given city.")
    })
});

const agent = createAgent({
    model: "gpt-4o-mini",
    tools: [searchTool, emailTool, getWether],
    middleware: [
        // Add model fallback middleware to ensure the agent can still respond even if the primary model fails or is unavailable.
        modelFallbackMiddleware("gpt-4o-mini", "gpt-3.5-turbo"),
        // Add summarization middleware to keep the conversation concise and focused by summarizing long conversations when they exceed a certain token limit.
        summarizationMiddleware({
            model: "gpt-4o",
            maxTokensBeforeSummary: 1000,
            messagesToKeep: 5
        }),
        // Add LLM tool selector middleware to enable the agent to choose the most appropriate tool for a given query based on the tool descriptions and the user's input.
        // This wil help the agent to choose if you have multiple tools and want the agent to decide which tool to use based on the user's query and the tool's capabilities.
        llmToolSelectorMiddleware({
            model: "gpt-4o-mini",
            maxTools: 2
        })
    ]
});

const response = await agent.invoke(
    {
        messages: [{ role: "user", content: "What is the weather in Hyderabad and email to john@gmail.com with subject 'weather report'?" }]
    }
);

console.log(response);