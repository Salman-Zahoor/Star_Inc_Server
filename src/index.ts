import "reflect-metadata";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDatabase } from "./utils/database";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import { ChatService } from "./services/ChatService";
import { authenticate } from "./middlewares/authenticate";
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust the CORS settings as necessary
    }
});
const chatService = new ChatService(io);

app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));

app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use('/uploads', express.static('uploads'));

// Mounting routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/chat", chatRoutes);
app.get("/", (req, res) => {res.send("Hello")});

connectDatabase()
    .then(() => {
        console.log("Database connected successfully");

        io.use(async (socket, next) => {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
            const guestId = socket.handshake.auth?.guestid || socket.handshake.headers?.guestid;
            if (token) {
                try {
                    const user = await chatService.authenticateUser(token);
                    socket.data.userId = user.id;
                    next();
                } catch (error) {
                    next(new Error("Unauthorized"));
                }
            } else if (guestId) {
                try {
                    const user = await chatService.createGuestUserIfNotExist(guestId);
                    socket.data.guestId = user.guestId;
                    next();
                } catch (error) {
                    next(new Error("Unauthorized"));
                }
            } else {
                next(new Error("Unauthorized"));
            }
        });

        io.on("connection", async (socket) => {
            console.log("a user connected");

            // Send initial guest user list
            try {
                const userId = socket.data.userId
                const guestUsers = await chatService.getGuestMessages(userId);
                socket.emit("guestUserList", guestUsers);
            } catch (error) {
                console.error("Error fetching guest user list:", error);
            }

            socket.on("disconnect", () => {
                console.log("user disconnected");
            });

            socket.on("chatMessage", async (msg) => {
                try {
                    const { content, toGuestId } = msg;
                    const guestId = toGuestId ?? socket.data.guestId
                    let userId = socket.data.userId
                    let conversationUserId = undefined
                    const existingConversation = await chatService.getGuestConversation(guestId);
                    if (existingConversation) {
                        conversationUserId = existingConversation.user.id
                    }

                    const message = await chatService.saveMessage(content, conversationUserId, userId, guestId);
                    io.emit("chatMessage", message);
                } catch (error) {
                    console.error("Error saving message: ", error);
                }
            });

            socket.on("selectGuest", async (guest) => {
                try {
                    const userId = socket.data.userId;
                    const { guestId } = guest;

                    console.log("Selecting guest:", guestId, "for user:", userId);

                    // Check if a conversation already exists
                    const existingConversation = await chatService.getConversation(userId, guestId);
                    if (!existingConversation) {
                        // Create a new conversation
                        const conversation = await chatService.createConversation(userId, guestId);
                        const messages = await chatService.getConversationMessages(userId, guestId);
                        socket.emit("conversationStarted", { conversation, messages });
                    } else {
                        const messages = await chatService.getConversationMessages(userId, guestId);
                        socket.emit("conversationStarted", { conversation: existingConversation, messages });
                    }
                } catch (error) {
                    console.error("Error selecting guest: ", error);
                }
            });
        });

        const PORT = process.env.PORT || 4000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("Database connection error: ", error);
        process.exit(1); // Exit the process with an error code if the connection fails
    });
