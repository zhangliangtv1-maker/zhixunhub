import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import statsRouter from "./stats";
import adminRouter from "./admin";
import subscribeRouter from "./subscribe";
import aiInsightRouter from "./ai-insight";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(statsRouter);
router.use(adminRouter);
router.use(subscribeRouter);
router.use(aiInsightRouter);

export default router;
