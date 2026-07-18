import { Router, type IRouter } from "express";
import healthRouter from "./health";
import campaignsRouter from "./campaigns";
import adsetsRouter from "./adsets";
import adsRouter from "./ads";
import insightsRouter from "./insights";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(campaignsRouter);
router.use(adsetsRouter);
router.use(adsRouter);
router.use(insightsRouter);
router.use(storageRouter);

export default router;
