import { Request, Response } from "express";
import { ChatService } from "../services/ChatService";

export class AuthController {
    private chatService = new ChatService();

    async registerUser(req: Request, res: Response) {
        const { firstName, lastName, email, password, role } = req.body;
        try {
            const user = await this.chatService.createUser(firstName, lastName, email, password, role);
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
        
    async loginUser(req: Request, res: Response) {
        const { email, password } = req.body;
        try {
            const data = await this.chatService.loginUser(email, password);
            res.json({ data });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async guestLogin(req: Request, res: Response) {
        try {
            const guestId = await this.chatService.createGuestUser();
            res.json({ guestId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
