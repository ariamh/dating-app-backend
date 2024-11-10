import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import swipeRoutes from "./routes/swipe";
import purchasePremiumRoutes from "./routes/premium";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/swipe", swipeRoutes);
app.use("/api/purchase-premium", purchasePremiumRoutes);

mongoose
  .connect("mongodb://localhost:27017/dealls-dating", {})
  .then(() => {
    console.log("Connect to MongoDB");
  })
  .catch(err => {
    console.error("Fail connect to MongoDB", err);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
