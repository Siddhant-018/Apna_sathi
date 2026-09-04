import { Router, type IRouter } from "express";
import healthRouter from "./health";
import feedbackRouter from "./feedback";
import actionsRouter from "./actions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(feedbackRouter);
router.use(actionsRouter);

export default router;
