import { Router } from "express";
import { purchasePremium } from "../controllers/premium.controller";
import { authenticateToken } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/", authenticateToken, purchasePremium);

export default router;
