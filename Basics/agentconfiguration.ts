import { createAgent, tool } from "langchain";
import z from "zod";
import * as fs from "fs";

const usersData = JSON.parse(fs.readFileSync("data/users.json", "utf8"));


// User Location tool to get the user's location based on their user ID from the context. This is a simple example, and you can customize it to fit your needs. The tool can be an API call, a database query, or any other function that provides useful information to the agent.
const getUserLocation = tool((_,config) =>
{
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

const config= {
    context: {user_id: "103"}
}

const qaConfig= {
    context: {user_id: "104"}
}

const system_Prompt = `You are a helpful assistant that provides weather information based on the user's location. 
you have access to the following tools:
- use the get_user_location tool to find out where the user is located 
- use the get_Weather tool to provide the current weather information for that location. 

Always use the get_user_location tool first to determine the user's location before providing any weather information. 
If the user's location is not available, default to providing weather information for Hyderabad.`;


const agent = createAgent({
    model: "gpt-5-nano",
    tools: [getUserLocation, getWether],
    systemPrompt: system_Prompt
});

// Invoke the agent with a message and handle the response
agent.invoke({
     messages:[{role: "user", content: "What is the weather in outside?" }]
},
qaConfig
).then((response) => {
    console.log(response);
    console.log(" Direct message: " + response.messages[response.messages.length - 1].content);
}).catch((error) => {
    console.error(error);
});