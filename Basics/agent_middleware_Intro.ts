import { createAgent, createMiddleware, initChatModel, tool } from "langchain";
import z from "zod";
import * as fs from "fs";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
// add description of this file and what all langchain features it is using in the comments here.
/*
Model Middleware: This file demonstrates how to create a custom middleware for 
dynamic model selection based on the number of messages in the conversation. 
The middleware checks the message count and selects either an advanced model or a basic model accordingly.
*/


const usersData = JSON.parse(fs.readFileSync("data/users.json", "utf8"));


// User Location tool to get the user's location based on their user ID from the context. This is a simple example, and you can customize it to fit your needs. The tool can be an API call, a database query, or any other function that provides useful information to the agent.
const getUserLocation = tool((_, config) => {
    const userId = config.context.user_id;
    // read the data from the data/users.json file and find the user location based on the user ID. In a real implementation, you would replace this with an actual API call to a user service or database query.
    const user = usersData.find((user: { id: string; location: string }) => user.id === userId);
    return user ? user.location : "Hederabad";
},
    {
        name: "get_user_location",
        description: "Get the user's information based on their user ID.",
        schema: z.object({})
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

const config = {
    configurable: { thread_id: "a" },
    context: { user_id: "103" },
    db: {}
}

const qaConfig = {
    configurable: { thread_id: "a" },
    context: { user_id: "105" },
    db: {}
}

const system_Prompt = `You are a helpful assistant that provides weather information based on the user's location. you also have a great sense of humor and always try to make the user laugh with your responses.
you have access to the following tools:
- use the get_user_location tool to find out where the user is located 
- use the get_Weather tool to provide the current weather information for that location. 

Always use the get_user_location tool first to determine the user's location before providing any weather information. 
If the user's location is not available, default to providing weather information for Hyderabad.`;

const resposne_Format = z.object({
    humour_response: z.string().describe("A humorous response to the user's query."),
    weather_response: z.string().describe("The weather information for the user's location.")
});

const advancedModel = await initChatModel("gpt-4o", {
    temperature: 0.7,
    max_tokens: 500,
    timeout: 10000
});


const basesicModel = new ChatOpenAI({
    model: "gpt-4o-mini"
});


const dynamicModelSelction = createMiddleware({
    name: "dynamic_model_selection",
    wrapModelCall: (request, handler) => {
        const messageCount = request.messages.length
        return handler({
            ...request,
            model: messageCount > 3 ? advancedModel : basesicModel
        });
    }
});

const agent = createAgent({
    model: basesicModel,
    tools: [getUserLocation, getWether],
    systemPrompt: system_Prompt,
    responseFormat: resposne_Format,
    middleware: [dynamicModelSelction]
    // memory: checkPointer
});

// Invoke the agent with a message and handle the response
agent.invoke({
    messages: [{ role: "user", content: "What is the weather in outside?" }]
},
    qaConfig
).then((response) => {
    console.log(response);
    //console.log(" Structured message: " + response.structuredResponse.humour_response);
}).catch((error) => {
    console.error(error);
});


const response1 = await agent.invoke({
    messages: [{ role: "user", content: "Suggest a good place in that location?" }]
},
    qaConfig
);
console.log(" Structured message: " + response1.structuredResponse.humour_response);

// Below invocation is with different configuration, different thread. So the agent will not have access to the previous conversation and will not be able to use the memory to recall the location. It will have to use the get_user_location tool again to get the location based on the user ID in the new configuration context.
const response2 = await agent.invoke({
    messages: [{ role: "user", content: "Suggest a good place in that location?" }]
},
    qaConfig
);
console.log(" Structured message: " + response2.structuredResponse.humour_response);

/*
output of this file will be similar to the agent_customize_features.ts file, but the model used for the first few messages will be 
gpt-4o-mini and once the message count exceeds 3, it will switch to gpt-4o for generating responses. 
This allows for dynamic model selection based on the conversation context and can help optimize performance and 
cost while still providing high-quality responses when needed.
*/