import { Response, NextFunction, Request } from "express";
import mongoose from "mongoose";
import { swipe } from "../controllers/swipeController";
import User from "../models/User";

jest.mock("../models/User");

const mockedUser = User as jest.Mocked<typeof User>;

interface UserPayload {
    id: string;
    email: string;
}

interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

const createMockUser = (overrides?: Partial<UserPayload>): UserPayload => {
    return {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: "testuser@example.com",
        ...overrides,
    };
};

describe("Swipe Controller", () => {
    let req: Partial<AuthenticatedRequest>;
    let res: Partial<Response>;
    let next: NextFunction;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        req = {};
        res = {};
        next = jest.fn();
        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn().mockReturnThis();
        res.status = statusMock;
        res.json = jsonMock;
        jest.clearAllMocks();

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it("should return 401 if user is not authenticated", async () => {
        req.user = undefined;

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 400 if targetUserId or direction is missing", async () => {
        const mockUser: UserPayload = createMockUser();
        req.user = mockUser;
        req.body = { targetUserId: "someId" };

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Missing targetUserId or direction." });
    });

    it("should return 400 for invalid direction", async () => {
        const mockUser: UserPayload = createMockUser();
        req.user = mockUser;
        req.body = { targetUserId: new mongoose.Types.ObjectId().toHexString(), direction: "up" };

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid direction. Must be 'left' or 'right'." });
    });

    it("should return 400 for invalid targetUserId format", async () => {
        const mockUser: UserPayload = createMockUser();
        req.user = mockUser;
        req.body = { targetUserId: "invalidId", direction: "left" };

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid targetUserId format." });
    });

    it("should return 400 if user tries to swipe on themselves", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        req.user = mockUser;
        req.body = { targetUserId: userId, direction: "left" };

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "You cannot swipe on your own profile." });
    });

    it("should return 404 if user is not found", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();

        req.user = mockUser;
        req.body = { targetUserId, direction: "left" };

        mockedUser.findById.mockResolvedValueOnce(null);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(mockedUser.findById).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 404 if target user is not found", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();

        req.user = mockUser;
        req.body = { targetUserId, direction: "left" };

        const user = {
            id: userId,
            swipedProfiles: [],
            lastSwipeDate: null,
            isPremium: false,
            premiumFeatures: null,
            save: jest.fn(),
        };

        mockedUser.findById.mockResolvedValueOnce(user as any);
        mockedUser.findById.mockResolvedValueOnce(null);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(mockedUser.findById).toHaveBeenCalledWith(userId);
        expect(mockedUser.findById).toHaveBeenCalledWith(targetUserId);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Target user not found." });
    });

    it("should return 400 if user has already swiped the target today", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();
        const today = new Date().toISOString().split('T')[0];

        req.user = mockUser;
        req.body = { targetUserId, direction: "right" };

        const user = {
            id: userId,
            swipedProfiles: [
                { userId: new mongoose.Types.ObjectId(targetUserId), direction: "left", date: today },
            ],
            lastSwipeDate: new Date(),
            isPremium: false,
            premiumFeatures: null,
            save: jest.fn(),
        };

        const targetUser = {
            id: targetUserId,
            isPremium: false,
            premiumFeatures: null,
        };

        mockedUser.findById.mockResolvedValueOnce(user as any);
        mockedUser.findById.mockResolvedValueOnce(targetUser as any);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "You have already swiped this profile today.",
            totalSwipes: 1,
        });
    });

    it("should return 400 if user has reached daily swipe limit", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();
        const today = new Date().toISOString().split('T')[0];
        const MAX_DAILY_SWIPES = 10;

        req.user = mockUser;
        req.body = { targetUserId, direction: "left" };

        const swipedProfiles = Array.from({ length: MAX_DAILY_SWIPES }).map((_, index) => ({
            userId: new mongoose.Types.ObjectId().toHexString(),
            direction: index % 2 === 0 ? "left" : "right",
            date: today,
        }));

        const user = {
            id: userId,
            swipedProfiles,
            lastSwipeDate: new Date(),
            isPremium: false,
            premiumFeatures: null,
            save: jest.fn(),
        };

        const targetUser = {
            id: targetUserId,
            isPremium: false,
            premiumFeatures: null,
        };

        mockedUser.findById.mockResolvedValueOnce(user as any);
        mockedUser.findById.mockResolvedValueOnce(targetUser as any);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "You have reached your daily swipe limit. Consider upgrading to Premium for unlimited swipes!",
            totalSwipes: MAX_DAILY_SWIPES,
        });
    });

    it("should allow swipe if user is premium with unlimited swipes", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();
        const today = new Date().toISOString().split('T')[0];

        req.user = mockUser;
        req.body = { targetUserId, direction: "right" };

        const user = {
            id: userId,
            swipedProfiles: [],
            lastSwipeDate: new Date(),
            isPremium: true,
            premiumFeatures: { unlimitedSwipes: true },
            save: jest.fn(),
        };

        const targetUser = {
            id: targetUserId,
            isPremium: true,
            premiumFeatures: { verifiedLabel: true },
        };

        mockedUser.findById.mockResolvedValueOnce(user as any);
        mockedUser.findById.mockResolvedValueOnce(targetUser as any);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(user.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "You like this user",
            totalSwipes: 1,
            remainingSwipes: "unlimited",
            targetUser: { isVerified: true },
        });
    });

    it("should allow swipe if user is non-premium and within swipe limit", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();
        const today = new Date().toISOString().split('T')[0];
        const MAX_DAILY_SWIPES = 10;

        req.user = mockUser;
        req.body = { targetUserId, direction: "left" };

        const swipedProfiles = Array.from({ length: MAX_DAILY_SWIPES - 1 }).map((_, index) => ({
            userId: new mongoose.Types.ObjectId().toHexString(),
            direction: index % 2 === 0 ? "left" : "right",
            date: today,
        }));

        const user = {
            id: userId,
            swipedProfiles,
            lastSwipeDate: new Date(),
            isPremium: false,
            premiumFeatures: null,
            save: jest.fn(),
        };

        const targetUser = {
            id: targetUserId,
            isPremium: false,
            premiumFeatures: null,
        };

        mockedUser.findById.mockResolvedValueOnce(user as any);
        mockedUser.findById.mockResolvedValueOnce(targetUser as any);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(user.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "You passed this user",
            totalSwipes: MAX_DAILY_SWIPES,
            remainingSwipes: 0,
            targetUser: { isVerified: false },
        });
    });

    it("should reset swipedProfiles if it's a new day", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        req.user = mockUser;
        req.body = { targetUserId, direction: "right" };

        const user = {
            id: userId,
            swipedProfiles: [
                { userId: new mongoose.Types.ObjectId().toHexString(), direction: "left", date: yesterday },
            ],
            lastSwipeDate: new Date(Date.now() - 86400000), // Yesterday
            isPremium: false,
            premiumFeatures: null,
            save: jest.fn(),
        };

        const targetUser = {
            id: targetUserId,
            isPremium: false,
            premiumFeatures: null,
        };

        mockedUser.findById.mockResolvedValueOnce(user as any);
        mockedUser.findById.mockResolvedValueOnce(targetUser as any);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(user.swipedProfiles.length).toBe(1);
        expect(user.swipedProfiles[0].userId.toString()).toBe(targetUserId);
        expect(user.swipedProfiles[0].date).toBe(today);
        expect(user.lastSwipeDate.toISOString().split('T')[0]).toBe(today);
        expect(user.save).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "You like this user",
            totalSwipes: 1,
            remainingSwipes: 10 - 1,
            targetUser: { isVerified: false },
        });
    });

    it("should handle errors and call next with the error", async () => {
        const mockUser: UserPayload = createMockUser();
        const userId = mockUser.id;
        const targetUserId = new mongoose.Types.ObjectId().toHexString();

        req.user = mockUser;
        req.body = { targetUserId, direction: "left" };

        const error = new Error("Database error");
        mockedUser.findById.mockRejectedValueOnce(error);

        await swipe(req as AuthenticatedRequest, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(console.error).toHaveBeenCalledWith('Error in swipe handler:', error);
    });
});
