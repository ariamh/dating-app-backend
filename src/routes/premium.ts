import { Router } from "express";
import { purchasePremium } from "../controllers/premiumController";
import { authenticateToken } from "../middlewares/authMiddlewares";

const router = Router();

router.post("/", authenticateToken, purchasePremium);

export default router;
