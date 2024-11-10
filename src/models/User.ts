import { Schema, model, Document, Types } from "mongoose";

interface PremiumFeatures {
  unlimitedSwipes?: boolean;
  verifiedLabel?: boolean;
}

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  isPremium: boolean;
  premiumFeatures: PremiumFeatures;
  swipedProfiles: {
    userId: Types.ObjectId;
    direction: "left" | "right";
    date: string;
  }[];
  lastSwipeDate: Date;
  createdAt: Date;
  lastLogin: Date | null;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumFeatures: {
    unlimitedSwipes: {
      type: Boolean,
      default: false
    },
    verifiedLabel: {
      type: Boolean,
      default: false
    }
  },
  swipedProfiles: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      direction: {
        type: String,
        enum: ["left", "right"],
        required: true
      },
      date: {
        type: String,
        required: true
      }
    }
  ],
  lastSwipeDate: {
    type: Date,
    default: new Date()
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export default model<IUser>("User", userSchema);
