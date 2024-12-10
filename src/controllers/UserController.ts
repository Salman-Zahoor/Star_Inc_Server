import { Request, Response } from "express";
import { ChatService } from "../services/ChatService";

export class UserController {
    private chatService = new ChatService();

    async getUsers(req: Request, res: Response) {
        try {
            const users = await this.chatService.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUsersWhoSentMessages(req: Request, res: Response) {
        try {
            const users = await this.chatService.getUsersWhoSentMessages();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateUserProfile(req: Request, res: Response) {
        const { firstName, email, phone } = req.body;
        const profilePic = req.file ? req.file.filename : null;
        const userId = Number(req.params.id);
        
        

        try {
            const updatedUser = await this.chatService.updateUserProfile(userId, firstName, email, phone, profilePic);
            res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
  

