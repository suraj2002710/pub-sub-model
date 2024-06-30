const express = require("express");
const Redis = require("ioredis");
const app = express();
const port = 6000;

const redisOptions = {
    host: "caching-2b7d475d-surajaheer448-090c.f.aivencloud.com",
    port: "23811",
    username: "default",
    password: "AVNS_Igebv88oj7SKZtoZtKy",
    maxRetriesPerRequest: 50,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
        }
    }
};

const pub = new Redis(redisOptions);
const sub = new Redis(redisOptions);

pub.on('error', (error) => {
    console.error('Redis publisher error:', error);
});

pub.on('connect', () => {
    console.error('Redis publisher connected');
});

sub.on('connect', () => {
    console.error('Redis subscriber connected');
});

sub.on('error', (error) => {
    console.error('Redis subscriber error:', error);
});

const server = app.listen(port, () => {
    console.log("Server started on port", port);
});

const io = require("socket.io")(server, {
    cors: {
        origin: ["*"]
    }
});

let clients = {};
let sockets
io.on("connection", (socket) => {
    sockets=socket
    console.log(`Client connected: ${socket.id}`);

    // Store the socket ID in the clients object
    clients[socket.id] = socket;

    socket.on("message", async (message) => {
        // Assume message contains { content: "some message", to: "specificUserSocketId" }
        const { content, to } = message;
        
        if (clients[to]) {
            // Send the message to the specific user
            clients[to].emit("recev", content);
        } else {
            // Optionally handle the case where the target user is not connected
            console.log(`User with socket ID ${to} is not connected`);
        }

        let a = await pub.publish("MESSAGES", JSON.stringify(message));
        console.log(a);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
        // Remove the socket ID from the clients object
        delete clients[socket.id];
    });

    // Handle other socket events here
});

sub.subscribe("MESSAGES");
sub.on('message', (channel, message) => {
    const parsedMessage = JSON.parse(message);
    console.log(parsedMessage, channel);
    sockets.to(parsedMessage.id).emit("recev", parsedMessage);
    // Broadcast the message to all connected clients
    // for (let id in clients) {
    //     clients[id].to(parsedMessage.id).emit("recev", parsedMessage);
    // }
});
