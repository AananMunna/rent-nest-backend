import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createPayment(
    req.body,
    req.user?.id as string,
    req.user?.role === "ADMIN",
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment session created successfully",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.confirmPayment(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment confirmed successfully",
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    throw new Error("Stripe signature is required.");
  }

  await paymentService.handleStripeWebhook(req.body as Buffer, signature);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Webhook processed successfully",
    data: null,
  });
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getPaymentHistory(
    req.user?.id as string,
    req.user?.role === "ADMIN",
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment history retrieved successfully",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const paymentId = Array.isArray(req.params.paymentId)
    ? req.params.paymentId[0]
    : req.params.paymentId;

  if (!paymentId) {
    throw new Error("Payment id is required.");
  }

  const result = await paymentService.getPaymentById(
    paymentId,
    req.user?.id as string,
    req.user?.role === "ADMIN",
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment retrieved successfully",
    data: result,
  });
});

export const paymentController = {
  createPayment,
  handleStripeWebhook,
  confirmPayment,
  getPaymentHistory,
  getPaymentById,
};
