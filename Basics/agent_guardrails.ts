import { createAgent, llmToolSelectorMiddleware, modelFallbackMiddleware, piiMiddleware, piiRedactionMiddleware, summarizationMiddleware, tool } from "langchain";
import z from "zod";

// This file defines an agent with middleware features for handling personally identifiable information (PII).
// The agent is configured with middleware to detect and handle PII such as credit card numbers, social security numbers, and phone numbers. 
// Depending on the type of PII detected, the middleware can block the request, redact the information, or mask it in the response. 
// This ensures that sensitive information is protected while still allowing the agent to provide useful responses to the user.

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
   // tools: [searchTool, emailTool, getWether],
    middleware: [
        piiMiddleware(
            "credit_card", {
                detector: /\b(?:\d[ -]*?){13,16}\b/g,
                strategy: "block"
            }
        ),
        piiMiddleware("ssn", { 
            detector: /\b\d{3}-\d{2}-\d{4}\b/g,
            strategy: "redact" 
        }),
        piiMiddleware("phone", { 
            detector: /\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b/g,
            strategy: "mask" })
    ]
});

// credit card number will be blocked and the agent will not respond to the query, ensuring that sensitive information is not 
// processed or stored by the agent, providing a strong guardrail against potential data leaks or misuse of personally identifiable 
// information (PII).
try {
  const result = await agent.invoke({
    messages: [{ role: "user", content: "My credit card is 1234-5678-9012-3456, please pay the bill." }]
  });
  console.log(result.messages[result.messages.length - 1].content);
} catch (error: any) {
  // Check if it's a PII error
  if (error.name === "PIIDetectionError") {
    console.warn(`[Guardrail Blocked]: A ${error.piiType} was detected. Request cancelled for security.`);
  } else {
    console.error("An unexpected error occurred:", error);
  }
}

// ssn and phone number will be redacted and masked in the response, but the agent will still be able to respond to the query without blocking it entirely, allowing for a more flexible handling of sensitive information while still providing useful responses to the user.
const ssnResponse = await agent.invoke(
    {
        messages: [{ role: "user", content: "my ssn is 123-45-6789, is this valid? call me at 555-123-4567." }]
    }
);

console.log(ssnResponse);
/* 
response:
 [Guardrail Blocked]: A credit_card was detected. Request cancelled for security.
{
  messages: [
    HumanMessage {
      "id": "e14b174b-2deb-4ac7-bb29-9c59f5540083",
      "content": "my ssn is [REDACTED_SSN], is this valid? call me at ********4567.",
      "additional_kwargs": {},
      "response_metadata": {}
    },
    AIMessage {
      "id": "chatcmpl-DGxHjrXAeF0mNkFEXnkCkQ6xmr9DU",
      "content": "I'm sorry, but I can't assist with personal information like Social Security Numbers or phone numbers. If you have questions or need assistance with a specific topic, feel free to ask!",
*/