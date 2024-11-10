import express from "express";
import bodyParser from 'body-parser';
import authRoutes from "./routes/auth.routes";
import swipeRoutes from "./routes/swipe.routes";
import purchasePremiumRoutes from "./routes/premium.routes";

const app = express();

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/swipe", swipeRoutes);
app.use("/api/purchase-premium", purchasePremiumRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default app;
