import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User, { IUser } from "../user.model";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dealls-dating";
const TOTAL_USERS = 20;
const DEFAULT_PASSWORD = "12345678";

interface UserSeedData {
  username: string;
  email: string;
  password: string;
  isPremium: boolean;
  premiumFeatures: {
    unlimitedSwipes: boolean;
    verifiedLabel: boolean;
  };
  swipedProfiles: never[];
  lastSwipeDate: Date;
  createdAt: Date;
  lastLogin: Date | null;
}

async function generateUserData(
  index: number,
  hashedPassword: string
): Promise<UserSeedData> {
  const isPremium = index < 5; // First 5 users are premium
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - (TOTAL_USERS - index));

  const premiumFeatures = {
    unlimitedSwipes: isPremium && index % 2 === 0,
    verifiedLabel: isPremium && (index % 2 === 0 || index === 2)
  };

  const names = [
    ["john", "smith"],
    ["emma", "johnson"],
    ["alex", "williams"],
    ["sarah", "brown"],
    ["mike", "jones"],
    ["lisa", "garcia"],
    ["david", "miller"],
    ["anna", "davis"],
    ["james", "rodriguez"],
    ["olivia", "martinez"],
    ["william", "hernandez"],
    ["sophia", "lopez"],
    ["robert", "gonzalez"],
    ["isabella", "wilson"],
    ["michael", "anderson"],
    ["emily", "thomas"],
    ["daniel", "taylor"],
    ["ava", "moore"],
    ["joseph", "jackson"],
    ["mia", "martin"]
  ];

  const [firstName, lastName] = names[index];

  return {
    username: `${firstName}_${lastName}`,
    email: `${firstName}.${lastName}@example.com`,
    password: hashedPassword,
    isPremium,
    premiumFeatures,
    swipedProfiles: [],
    lastSwipeDate: timestamp,
    createdAt: timestamp,
    lastLogin: index % 3 === 0 ? timestamp : null
  };
}

async function seedUsers() {
  let connection: typeof mongoose | null = null;

  try {
    console.log("Connecting to MongoDB...");
    connection = await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully to MongoDB");

    console.log("Generating password hash...");
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    console.log("Clearing existing users...");
    await User.deleteMany({});
    console.log("Existing users cleared");

    console.log("Generating user data...");
    const userPromises = Array.from({ length: TOTAL_USERS }, (_, index) =>
      generateUserData(index, hashedPassword)
    );
    const userData = await Promise.all(userPromises);

    console.log("Inserting users...");
    const insertedUsers = (await User.insertMany(userData, {
      ordered: true
    })) as IUser[];
    console.log(`Successfully inserted ${insertedUsers.length} users`);

    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    console.log("\nUser Summary:");
    const summary = insertedUsers.map((user: IUser) => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      isPremium: user.isPremium,
      premiumFeatures: user.premiumFeatures
    }));
    console.table(summary);

    console.log("Ensuring indexes...");
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log("Indexes created successfully");
  } catch (error) {
    console.error("Error in seeding users:", error);
    throw error;
  } finally {
    if (connection) {
      console.log("Closing MongoDB connection...");
      await connection.disconnect();
      console.log("MongoDB connection closed");
    }
  }
}

seedUsers()
  .then(() => {
    console.log("Seeding completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
