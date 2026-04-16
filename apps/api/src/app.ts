import cors from "cors";
import express, { type Request, type Response } from "express";
import { messagesRouter } from "./routes/messages";
import { metaRouter } from "./routes/meta";
import { sessionRouter } from "./routes/session";

const app: express.Express = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, app: "MyRealmsAI V0.3 Skeleton" });
});

app.use("/api/meta", metaRouter);
app.use("/api/session", sessionRouter);
app.use("/api/messages", messagesRouter);

export default app;
