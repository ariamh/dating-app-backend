import { RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET_KEY = "dealls-dating-2024";

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, string>;
}

export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many attempts, please try again later"
});

export const validateRegister = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email")
    .custom(async email => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email already registered");
      }
      return true;
    }),
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage(
      "Username must be 3-30 characters and can only contain letters, numbers and underscore"
    )
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Username must be 3-30 characters and can only contain letters, numbers and underscore"
    ),
  body("password")
    .isLength({ min: 8, max: 20 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must be 8-20 characters and contain uppercase, lowercase, number and special character"
    )
];

export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
];

export const register: RequestHandler = async (req, res): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { username, email, password } = req.body as RegisterRequest;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: null
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful"
    });
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const mongoError = error as MongoError;

      if (mongoError.code === 11000 && mongoError.keyPattern) {
        const field = Object.keys(mongoError.keyPattern)[0];
        res.status(409).json({
          success: false,
          message: `This ${field} is already registered. Please use a different ${field}.`
        });
        return;
      }
    }

    if (
      error instanceof Error &&
      error.message === "Email already registered"
    ) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error(
      "Registration error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    res.status(500).json({
      success: false,
      message: "An error occurred during registration. Please try again later."
    });
  }
};

export const login: RequestHandler = async (req, res): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body as LoginRequest;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
      return;
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = jwt.sign({ id: user._id }, JWT_SECRET_KEY!, {
      expiresIn: "1d"
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login"
    });
  }
};
