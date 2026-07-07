import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewService.createReview(req.body, req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Review created successfully",
        data: result
    });
});

const getPropertyReviews = catchAsync(async (req: Request, res: Response) => {
    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;

    if (!propertyId) {
        throw new Error("Property id is required.");
    }

    const result = await reviewService.getPropertyReviews(propertyId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Reviews retrieved successfully",
        data: result
    });
});

export const reviewController = {
    createReview,
    getPropertyReviews
};