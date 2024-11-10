import { Response } from "express";
import mongoose from "mongoose";
import { purchasePremium } from "../controllers/premium.controller";
import User from "../models/user.model";
import { AuthenticatedRequest } from "../middlewares/auth.middlewares";

jest.mock("../models/user.model");

const mockedUser = User as jest.Mocked<typeof User>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockUser = (overrides?: Partial<any>): any => {
  return {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: "testuser@example.com",
    isPremium: false,
    ...overrides
  };
};

describe("Purchase Premium Controller", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {};
    res = {};
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();
    res.status = statusMock;
    res.json = jsonMock;
    jest.clearAllMocks();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 401 if user is not authenticated", async () => {
    req.user = undefined;

    await purchasePremium(req as AuthenticatedRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized"
    });
  });

  it("should return 404 if user is not found", async () => {
    const mockUser = createMockUser();
    const userId = mockUser.id;

    req.user = mockUser;

    mockedUser.findById.mockResolvedValueOnce(null);

    await purchasePremium(req as AuthenticatedRequest, res as Response);

    expect(mockedUser.findById).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found"
    });
  });

  it("should return 400 if user already has premium status", async () => {
    const mockUser = createMockUser({ isPremium: true });
    const userId = mockUser.id;

    req.user = mockUser;

    const userDocument = {
      _id: new mongoose.Types.ObjectId(userId),
      email: mockUser.email,
      isPremium: true,
      save: jest.fn()
    };

    mockedUser.findById.mockResolvedValueOnce(userDocument as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    await purchasePremium(req as AuthenticatedRequest, res as Response);

    expect(mockedUser.findById).toHaveBeenCalledWith(userId);
    expect(userDocument.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User already has premium status"
    });
  });

  it("should successfully purchase premium for user", async () => {
    const mockUser = createMockUser();
    const userId = mockUser.id;

    req.user = mockUser;

    const userDocument = {
      _id: new mongoose.Types.ObjectId(userId),
      email: mockUser.email,
      isPremium: false,
      save: jest.fn().mockResolvedValueOnce(true)
    };

    mockedUser.findById.mockResolvedValueOnce(userDocument as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    await purchasePremium(req as AuthenticatedRequest, res as Response);

    expect(mockedUser.findById).toHaveBeenCalledWith(userId);
    expect(userDocument.isPremium).toBe(true);
    expect(userDocument.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Purchase successfully",
      data: {
        userId: userDocument._id,
        isPremium: userDocument.isPremium
      }
    });
  });

  it("should handle errors and return 500", async () => {
    const mockUser = createMockUser();
    const userId = mockUser.id;

    req.user = mockUser;

    const error = new Error("Database error");
    mockedUser.findById.mockRejectedValueOnce(error);

    await purchasePremium(req as AuthenticatedRequest, res as Response);

    expect(mockedUser.findById).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error"
    });
    expect(console.error).toHaveBeenCalledWith(
      "Purchase Premium Error:",
      error
    );
  });
});
