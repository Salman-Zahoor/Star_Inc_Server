import { Repository } from "typeorm";
import { AppDataSource } from "../utils/database";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { Conversation } from "../entities/Conversation";
import { generateToken, verifyToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid"; // To generate unique guest IDs
import { Server } from "socket.io";

export class ChatService {
    private messageRepository: Repository<Message>;
    private userRepository: Repository<User>;
    private conversationRepository: Repository<Conversation>;
    private io: Server;

    constructor(io?: Server) {
        this.messageRepository = AppDataSource.getRepository(Message);
        this.userRepository = AppDataSource.getRepository(User);
        this.conversationRepository = AppDataSource.getRepository(Conversation);
        this.io = io;
    }

    async saveMessage(content: string, conversationUserId?: number, userId?: number, guestId?: string): Promise<Message> {
        let user: User | null = null;
        let conversation: Conversation | null = null;

        if (userId) {
            // Fetch the authenticated user
            user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error("User not found");
            }
        } else if (guestId) {
            // For guest messages, handle guest context
            user = await this.userRepository.findOne({ where: { guestId } });
            if (!user) {
                // If the guest user doesn't exist, create a new guest user
                user = new User();
                user.guestId = guestId;
                user.role = "guest";
                await this.userRepository.save(user);
            }
        } else {
            throw new Error("Either userId or guestId must be provided");
        }

        // Create the message entity
        const message = new Message();
        message.content = content;
        message.user = user;
        message.guestId = guestId || null;

        // Only check for conversation if both userId and guestId are provided
        if (conversationUserId && guestId) {
            console.log(guestId, "<----conversationUserId")
            // Check if there is an existing conversation for the guest and the user
            conversation = await this.conversationRepository.createQueryBuilder("conversation")
                .where("conversation.guestId = :guestId", { guestId })
                .andWhere("conversation.userId = :userId", { userId: conversationUserId }) // Use setParameter for userId
                .getOne();
        }
        console.log(conversation, "<----conversation")

        // If conversation doesn't exist, create a new one
        // if (!conversation && conversationUserId && guestId) {
        //     conversation = await this.createConversation(conversationUserId, guestId);
        // }

        // Associate the message with the conversation if it exists
        message.conversation = conversation || null;

        // Save the message entity
        const savedMessage = await this.messageRepository.save(message);

        // Update the guest user list
        try {
            const guestUsers = await this.getGuestMessages(userId);
            this.io.emit("guestUserList", guestUsers);
        } catch (error) {
            console.error("Error emitting guest user list:", error);
        }

        return savedMessage;
    }

    async getGuestMessages(userId: number): Promise<{ user: User; message: Message }[]> {
        // Subquery to find all guest IDs that have started a conversation with the given user
        const subQuery = this.conversationRepository
            .createQueryBuilder("conversation")
            .select("DISTINCT conversation.guestId", "guestId")
            .where("conversation.userId = :userId", { userId });

        // Main query to fetch the latest message from each guest who has not started a conversation with the user
        const latestMessages = await this.messageRepository
            .createQueryBuilder("message")
            .innerJoin(
                qb => qb
                    .from(Message, "msg")
                    .select("MAX(msg.createdAt)", "maxCreatedAt")
                    .addSelect("msg.guestId", "guestId")
                    .groupBy("msg.guestId"),
                "latest",
                "message.guestId = latest.guestId AND message.createdAt = latest.maxCreatedAt"
            )
            .leftJoinAndSelect("message.user", "user")
            .where("message.guestId IS NOT NULL")
            .andWhere("message.conversationId IS NULL")
            .andWhere(`message.guestId NOT IN (${subQuery.getQuery()})`)
            .setParameter("userId", userId)
            .orderBy("message.createdAt", "DESC")
            .getMany();

        // Build a map of unique guest users with their latest message
        const uniqueUsers = new Map<string, { user: User; message: Message }>();

        latestMessages.forEach((message) => {
            const guestId = message.guestId!;
            if (!uniqueUsers.has(guestId)) {
                uniqueUsers.set(guestId, { user: message.user, message });
            }
        });

        return Array.from(uniqueUsers.values());
    }

    async getRecentMessagesById(id: string): Promise<Message[]> {
        return this.messageRepository.find({
            order: { createdAt: "DESC" },
            take: 50,
            relations: ["user"],
            where: {
                guestId: id
            }
        });
    }

    async createConversation(userId: number, guestId: string): Promise<Conversation> {
        const conversation = new Conversation();
        conversation.user = await this.userRepository.findOne({ where: { id: userId } });
        conversation.guestId = guestId;
        await this.conversationRepository.save(conversation);
        return conversation;
    }

    async getUserConversationsWithGuests(userId: number): Promise<{ conversation: Conversation; message: Message }[]> {
        const conversations = await this.conversationRepository.find({
            where: { user: { id: userId } },
            relations: ["user"],
        });

        const conversationMessages = await Promise.all(conversations.map(async (conversation) => {
            const message = await this.messageRepository.findOne({
                where: { guestId: conversation.guestId },
                order: { createdAt: "DESC" },
                relations: ["user"],
            });
            return { conversation, message };
        }));

        return conversationMessages;
    }

    async getConversationMessages(userId: number, guestId: string): Promise<Message[]> {
        return this.messageRepository.find({
            where: {
                guestId: guestId,
                user: { id: userId },
            },
            order: { createdAt: "ASC" },
            relations: ["user"],
        });
    }

    async saveConversationMessage(content: string, userId: number, guestId: string): Promise<Message> {
        const message = new Message();
        message.content = content;
        message.user = await this.userRepository.findOne({ where: { id: userId } });
        message.guestId = guestId;
        await this.messageRepository.save(message);
        return message;
    }

    async getConversation(userId: number, guestId: string): Promise<Conversation | null> {
        return this.conversationRepository.findOne({
            where: {
                user: { id: userId },
                guestId: guestId,
            },
            relations: ["user"],
        });
    }

    async getGuestConversation(guestId: string): Promise<Conversation | null> {
        return this.conversationRepository.findOne({
            where: {
                guestId: guestId,
            },
            relations: ["user"],
        });
    }

    async createUser(firstName: string, lastName: string, email: string, password: string, role: string): Promise<User> {
        const user = new User();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.password = await bcrypt.hash(password, 10); // Hash the password
        user.role = role;
        await this.userRepository.save(user);
        return user;
    }

    async createGuestUser(): Promise<string> {
        const guestId = uuidv4();
        const user = new User();
        user.guestId = guestId;
        user.isActive = true;
        user.role = "guest";
        await this.userRepository.save(user);
        return guestId;
    }

    async createGuestUserIfNotExist(guestId: string): Promise<User> {
        let user = await this.userRepository.findOne({ where: { guestId } });
        if (!user) {
            user = new User();
            user.guestId = guestId;
            user.role = "guest";
            await this.userRepository.save(user);
        }
        return user;
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find();
    }

    async getUsersWhoSentMessages(): Promise<User[]> {
        return this.userRepository.createQueryBuilder("user")
            .innerJoinAndSelect("user.messages", "message")
            .distinct(true)
            .getMany();
    }

    async authenticateUser(token: string): Promise<User> {
        const payload = verifyToken(token);
        const user = await this.userRepository.findOne({ where: { id: payload.userId } });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async generateUserToken(userId: number): Promise<string> {
        return generateToken(userId);
    }

    async authenticateUserByEmail(email: string, password: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error("User not found");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        return user;
    }

    async saveUserToken(userId: number, token: string): Promise<void> {
        // Save the token in the database associated with the user
        await AppDataSource.query('UPDATE users SET token = ? WHERE id = ?', [token, userId]);
    }

    async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
        const user = await this.authenticateUserByEmail(email, password);
        const token = await this.generateUserToken(user.id);
        await this.saveUserToken(user.id, token);
        return { user, token };
    }

    async updateUserProfile(userId: number, firstName: string, email: string, phone: number, profilePic: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        user.firstName = firstName;
        user.email = email;
        user.phone = phone;
        if (profilePic) {
            user.profilePic = profilePic;
        }

        await this.userRepository.save(user);
        return user;
    }
}
