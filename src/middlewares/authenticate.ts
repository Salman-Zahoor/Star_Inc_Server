import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ChatService } from "../services/ChatService";

const chatService = new ChatService();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const payload = verifyToken(token);
        const user = await chatService.authenticateUser(token);
        req.userId = user.id;
        next();
    } catch (error) {
        res.status(401).json({ error: "Unauthorized" });
    }
};
