import { Router } from "express";
import { swipe } from "../controllers/swipe.controller";
import { authenticateToken } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/", authenticateToken, swipe);

export default router;
