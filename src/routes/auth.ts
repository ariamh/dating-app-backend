import { Router } from "express";
import { register, login, validateRegister, validateLogin, rateLimiter } from "../controllers/authController";

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

export default router;
