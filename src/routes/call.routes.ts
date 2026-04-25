import { Router } from "express";
import { callController } from "../controllers/call.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/initiate", protect, callController.initiateCall);
router.post("/accept", protect, callController.acceptCall);
router.post("/reject", protect, callController.rejectCall);
router.post("/missed", protect, callController.missedCall);
router.post("/end", protect, callController.endCall);
router.get("/history", protect, callController.getCallHistory);
router.get("/missed", protect, callController.getMissedCalls);

export const callRoutes = router;