import { createAgent, tool } from "langchain";
import "dotenv/config";
import z from "zod";


// This file defines a basic agent with tools for getting weather and time information.


// Define a tool for getting the weather. This is a simple example, and you can customize it to fit your needs. The tool can be an API call, a database query, or any other function that provides useful information to the agent.
const getWether = tool((input) => {
    // In a real implementation, you would replace this with an actual API call to a weather service.
    return `The weather in ${input.city} is sunny with a high of 25°C.`;
}, {
    // tool metadata
    name: "get_Weather",
    description: "Get the current weather for a given city.",
    schema: z.object({
        city: z.string().describe("The name of the city to get the weather for.")
    })
});

// Define another tool for getting the time. This is just an example, and you can create as many tools as you need to provide the agent with the information it needs to answer questions and perform tasks.
const getTime = tool((input) => {
    // In a real implementation, you would replace this with an actual API call to a time service.
    return `The current time in ${input.city} is 2:00 PM.`;
},{
     // tool metadata
    name: "get_time",
    description: "Get the current time for a given city.",
    schema: z.object({
        city: z.string().describe("The name of the city to get the time for.")
    })
});


// Create an agent with the specified model. It has basic construction here but you can customize it with tools, memory, and more.
// Here we are creating a simple agent with the "gpt-3.5-turbo" model and a single tool for getting the weather.
const agent = createAgent({
    model: "gpt-3.5-turbo",
    tools: [getWether, getTime]
});


// Invoke the agent with a message and handle the response
agent.invoke({
   // messages:[{role: "user", content: "What is the Product of 2*22" }]
   // messages:[{role: "user", content: "What is the weather in hyderabad?" }]
   // messages:[{role: "user", content: "What is the time in hyderabad?" }]
    messages:[{role: "user", content: "What is the time and weather in hyderabad?" }]
}).then((response) => {
    console.log(response);
    console.log(" Direct message: " + response.messages[response.messages.length - 1].content);
}).catch((error) => {
    console.error(error);
});