// database.ts
import { DataSource } from "typeorm";
import { Message } from "../entities/Message";
import { MessageSubscriber } from "../subscribers/MessageSubscriber";
import { User } from "../entities/User";
import { ChatService } from "../services/ChatService";
import { config } from "dotenv";
import { Conversation } from "../entities/Conversation";

config();

export const AppDataSource = new DataSource({
    name: 'default',
    type: "mysql",
    host: "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Message, User, Conversation],
    subscribers: [MessageSubscriber],
    synchronize: true, // Note: This should be false in production
});

export const connectDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        // Create an admin user if it doesn't exist
        const userRepository = AppDataSource.getRepository(User);
        const adminExists = await userRepository.findOne({ where: { role: "admin" } });
        if (!adminExists) {
            const chatService = new ChatService();
            await chatService.createUser("Admin", "user", "admin@example.com", "adminpassword", "admin");
            console.log("Admin user created");
        }
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
    }
};