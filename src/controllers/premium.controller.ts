import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middlewares";
import User from "../models/user.model";

export const purchasePremium = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
      return;
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    if (user.isPremium) {
      res.status(400).json({
        success: false,
        message: "User already has premium status"
      });
      return;
    }

    user.isPremium = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Purchase successfully",
      data: {
        userId: user._id,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error("Purchase Premium Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
