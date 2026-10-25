import express from "express";
import {
  generatePayroll,
  generateAllPayroll,
  getPayrolls,
  finalizePayroll,
  finalizeAll,
} from "../controllers/payroll.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getPayrolls);
router.post("/generate", authorize("admin", "hr"), generatePayroll);
router.post("/generate-all", authorize("admin", "hr"), generateAllPayroll);
router.put("/:id/finalize", authorize("admin"), finalizePayroll);
router.post("/finalize-all", authorize("admin"), finalizeAll);

export default router;
