import { Request, Response } from "express";
import { ChatService } from "../services/ChatService";

export class ChatController {
    private chatService = new ChatService();

    async postMessage(req: Request, res: Response) {
        const { content, guestId } = req.body;
        const userId = req.userId; // Use userId from authenticated request
        if (!userId && !guestId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        try {
            const message = await this.chatService.saveMessage(content, userId, guestId);
            res.json(message);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getGuestMessages(req: Request, res: Response) {
        try {
            const userId = req.userId
            const messages = await this.chatService.getGuestMessages(userId);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getMessagesById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const messages = await this.chatService.getRecentMessagesById(id);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getConversationMessages(req: Request, res: Response) {
        const { guestId } = req.params;
        const userId = req.userId;
        try {
            const messages = await this.chatService.getConversationMessages(userId, guestId);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getConversationMessagesWithGuest(req: Request, res: Response) {
        try {
            const userId = req.userId;
            const conversationsWithMessages = await this.chatService.getUserConversationsWithGuests(userId);
            res.json(conversationsWithMessages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
