import request from "supertest";
import express, { Application } from "express";
import {
  register,
  login,
  validateRegister,
  validateLogin
} from "../controllers/auth.controller";
import User, { IUser } from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth Routes", () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post("/register", validateRegister, register);
    app.post("/login", validateLogin, login);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    it("Berhasil mendaftarkan user baru", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");

      jest.spyOn(User.prototype, "save").mockResolvedValueOnce({
        email: "test@example.com",
        username: "testuser"
      });

      const response = await request(app)
        .post("/register")
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "Password123!"
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: "Registration successful"
      });
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 12);
      expect(User.prototype.save).toHaveBeenCalled();
    });

    it("Gagal mendaftar jika email sudah terdaftar", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({
        email: "test@example.com"
      } as IUser);

      const response = await request(app)
        .post("/register")
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "Password123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.any(Array)
      });
      expect(response.body.errors[0]).toHaveProperty(
        "msg",
        "Email already registered"
      );
    });

    it("Gagal mendaftar jika email tidak valid", async () => {
      const response = await request(app)
        .post("/register")
        .send({
          email: "invalidemail",
          username: "testuser",
          password: "Password123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.any(Array)
      });
      expect(response.body.errors[0]).toHaveProperty(
        "msg",
        "Please enter a valid email"
      );
    });

    it("Gagal mendaftar jika password tidak memenuhi kriteria", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post("/register")
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.any(Array)
      });
      expect(response.body.errors[0]).toHaveProperty(
        "msg",
        "Password must be 8-20 characters and contain uppercase, lowercase, number and special character"
      );
    });

    it("Gagal mendaftar jika username tidak valid", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post("/register")
        .send({
          email: "test@example.com",
          username: "ab",
          password: "Password123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.any(Array)
      });
      expect(response.body.errors[0]).toHaveProperty(
        "msg",
        "Username must be 3-30 characters and can only contain letters, numbers and underscore"
      );
    });
  });

  describe("POST /login", () => {
    it("Berhasil login dengan kredensial valid", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({
        _id: "userId",
        email: "test@example.com",
        password: "hashedpassword"
      } as IUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jest.spyOn(User, "updateOne").mockResolvedValue({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      (jwt.sign as jest.Mock).mockReturnValue("token");

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "Password123!"
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Login successful",
        data: { token: "token" }
      });
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "Password123!",
        "hashedpassword"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "userId" },
        "dealls-dating-2024",
        {
          expiresIn: "1d"
        }
      );
    });

    it("Gagal login dengan email tidak terdaftar", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post("/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Invalid credentials"
      });
      expect(User.findOne).toHaveBeenCalledWith({
        email: "nonexistent@example.com"
      });
    });

    it("Gagal login dengan password salah", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({
        _id: "userId",
        email: "test@example.com",
        password: "hashedpassword"
      } as IUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Invalid credentials"
      });
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "WrongPassword",
        "hashedpassword"
      );
    });

    it("Gagal login jika email tidak valid", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "invalidemail",
          password: "Password123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.any(Array)
      });
      expect(response.body.errors[0]).toHaveProperty(
        "msg",
        "Please enter a valid email"
      );
    });

    it("Gagal login jika password terlalu pendek", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "short"
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.any(Array)
      });
      expect(response.body.errors[0]).toHaveProperty(
        "msg",
        "Password must be at least 8 characters long"
      );
    });
  });
});
