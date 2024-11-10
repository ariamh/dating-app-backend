import { Router } from "express";
import { swipe } from "../controllers/swipeController";
import { authenticateToken } from "../middlewares/authMiddlewares";

const router = Router();

router.post("/", authenticateToken, swipe);

export default router;
