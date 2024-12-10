import express from "express";
import { ChatController } from "../controllers/ChatController";
import { authenticate } from "../middlewares/authenticate";

const chatController = new ChatController();
const router = express.Router();

router.post("/message", authenticate, (req, res) => chatController.postMessage(req, res));
router.get("/guest-messages", authenticate, (req, res) => chatController.getGuestMessages(req, res));
router.get("/messages/:id", (req, res) => chatController.getMessagesById(req, res));
router.get("/conversation/:guestId", authenticate, (req, res) => chatController.getConversationMessages(req, res));
router.get("/user-conversations", authenticate, (req, res) => chatController.getConversationMessagesWithGuest(req, res));

export default router;
