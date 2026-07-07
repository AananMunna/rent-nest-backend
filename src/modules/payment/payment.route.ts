import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { paymentController } from "./payment.controller";

const router = Router();

router.post("/create", auth(Role.TENANT, Role.ADMIN), paymentController.createPayment);
router.post("/webhook", paymentController.handleStripeWebhook);
router.post("/confirm", paymentController.confirmPayment);
router.get("/", auth(), paymentController.getPaymentHistory);
router.get("/:paymentId", auth(), paymentController.getPaymentById);

export const paymentRoutes = router;