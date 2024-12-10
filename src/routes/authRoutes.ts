import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middlewares/authenticate";

const router = Router();
const authController = new AuthController();

router.post("/register", authenticate, (req, res) => authController.registerUser(req, res));
router.post("/login", (req, res) => authController.loginUser(req, res));
router.post("/guest-login", (req, res) => authController.guestLogin(req, res));

export default router;
