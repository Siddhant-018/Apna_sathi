import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, feedbackTable } from "@workspace/db";
import {
  CreateFeedbackBody,
  CreateFeedbackResponse,
  GetFeedbackParams,
  GetFeedbackResponse,
  ListFeedbackResponse,
  UpdateFeedbackBody,
  UpdateFeedbackParams,
  UpdateFeedbackResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/feedback", async (_req, res): Promise<void> => {
  const feedback = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt));
  res.json(ListFeedbackResponse.parse(feedback));
});

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [feedback] = await db
    .insert(feedbackTable)
    .values({
      category: parsed.data.category,
      location: parsed.data.location,
      rating: Math.round(parsed.data.rating),
      issue: parsed.data.issue,
      message: parsed.data.message,
    })
    .returning();

  res.status(201).json(CreateFeedbackResponse.parse(feedback));
});

router.get("/feedback/:id", async (req, res): Promise<void> => {
  const params = GetFeedbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [feedback] = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.id, params.data.id));

  if (!feedback) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  res.json(GetFeedbackResponse.parse(feedback));
});

router.patch("/feedback/:id", async (req, res): Promise<void> => {
  const params = UpdateFeedbackParams.safeParse(req.params);
  const body = UpdateFeedbackBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid feedback update" });
    return;
  }

  const [feedback] = await db
    .update(feedbackTable)
    .set({ status: body.data.status })
    .where(eq(feedbackTable.id, params.data.id))
    .returning();

  if (!feedback) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  res.json(UpdateFeedbackResponse.parse(feedback));
});

export default router;