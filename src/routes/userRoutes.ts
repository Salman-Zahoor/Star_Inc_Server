import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { upload } from "../utils/index";
import { authenticate } from "../middlewares/authenticate";

const router = Router();
const userController = new UserController();

router.get("/getUsers", authenticate, (req, res) => userController.getUsers(req, res));
router.get("/users/sent-messages", (req, res) => userController.getUsersWhoSentMessages(req, res));
router.put("/updateUserProfile/:id", upload, (req, res) => userController.updateUserProfile(req, res));

export default router;
