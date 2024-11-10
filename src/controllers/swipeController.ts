import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import { AuthenticatedRequest } from "../middlewares/authMiddlewares";

const MAX_DAILY_SWIPES = 10;

export const swipe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { targetUserId, direction } = req.body;
    if (!targetUserId || !direction) {
      res.status(400).json({ message: "Missing targetUserId or direction." });
      return;
    }

    const validDirections = ["left", "right"] as const;
    if (!validDirections.includes(direction)) {
      res
        .status(400)
        .json({ message: "Invalid direction. Must be 'left' or 'right'." });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({ message: "Invalid targetUserId format." });
      return;
    }

    if (targetUserId === userId) {
      res
        .status(400)
        .json({ message: "You cannot swipe on your own profile." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ message: "Target user not found." });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const lastSwipeDay = user.lastSwipeDate
      ? user.lastSwipeDate.toISOString().split("T")[0]
      : "";

    if (!Array.isArray(user.swipedProfiles)) {
      user.swipedProfiles = [];
    }

    if (today !== lastSwipeDay) {
      user.swipedProfiles = [];
      user.lastSwipeDate = new Date();
    }

    const todaySwipes = user.swipedProfiles.filter(
      profile => profile.date === today
    );

    const alreadySwiped = todaySwipes.some(
      profile => profile.userId.toString() === targetUserId
    );

    if (alreadySwiped) {
      res.status(400).json({
        message: "You have already swiped this profile today.",
        totalSwipes: todaySwipes.length
      });
      return;
    }

    const hasUnlimitedSwipes =
      user.isPremium && user.premiumFeatures?.unlimitedSwipes;
    if (!hasUnlimitedSwipes && todaySwipes.length >= MAX_DAILY_SWIPES) {
      res.status(400).json({
        message:
          "You have reached your daily swipe limit. Consider upgrading to Premium for unlimited swipes!",
        totalSwipes: todaySwipes.length
      });
      return;
    }

    const newSwipe = {
      userId: new mongoose.Types.ObjectId(targetUserId),
      direction: direction as "left" | "right",
      date: today
    };

    user.swipedProfiles.push(newSwipe);

    await user.save();

    const targetUserInfo = {
      isVerified:
        targetUser.isPremium && targetUser.premiumFeatures?.verifiedLabel
    };

    res.status(200).json({
      message: `You ${direction === "right" ? "like" : "passed"} this user`,
      totalSwipes: todaySwipes.length + 1,
      remainingSwipes: hasUnlimitedSwipes
        ? "unlimited"
        : Math.max(0, MAX_DAILY_SWIPES - (todaySwipes.length + 1)),
      targetUser: targetUserInfo
    });
  } catch (err) {
    console.error("Error in swipe handler:", err);
    next(err);
  }
};
