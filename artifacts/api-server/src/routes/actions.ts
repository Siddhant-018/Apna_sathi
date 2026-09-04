import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { actionsTable } from "@workspace/db";
import { db } from "@workspace/db";
import {
  CreateActionBody,
  CreateActionResponse,
  ListActionsResponse,
  UpdateActionBody,
  UpdateActionParams,
  UpdateActionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/actions", async (_req, res): Promise<void> => {
  const actions = await db
    .select()
    .from(actionsTable)
    .orderBy(desc(actionsTable.updatedAt));
  res.json(ListActionsResponse.parse(actions));
});

router.post("/actions", async (req, res): Promise<void> => {
  const parsed = CreateActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [action] = await db
    .insert(actionsTable)
    .values({
      feedbackId: Math.round(parsed.data.feedbackId),
      issue: parsed.data.issue,
      department: parsed.data.department,
      priority: parsed.data.priority,
    })
    .returning();

  res.status(201).json(CreateActionResponse.parse(action));
});

router.patch("/actions/:id", async (req, res): Promise<void> => {
  const params = UpdateActionParams.safeParse(req.params);
  const body = UpdateActionBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid action update" });
    return;
  }

  const [action] = await db
    .update(actionsTable)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(actionsTable.id, params.data.id))
    .returning();

  if (!action) {
    res.status(404).json({ error: "Action not found" });
    return;
  }

  res.json(UpdateActionResponse.parse(action));
});

export default router;