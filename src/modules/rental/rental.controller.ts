import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rental.service";

const createRentalRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.createRentalRequest(req.body, req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Rental request created successfully",
        data: result
    });
});

const getMyRentalRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.getMyRentalRequests(req.user?.id as string, req.user?.role);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental requests retrieved successfully",
        data: result
    });
});

const getRentalRequestById = catchAsync(async (req: Request, res: Response) => {
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    if (!requestId) {
        throw new Error("Rental request id is required.");
    }

    const result = await rentalService.getRentalRequestById(
        requestId,
        req.user?.id as string,
        req.user?.role
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental request retrieved successfully",
        data: result
    });
});

const getLandlordRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.getLandlordRequests(req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Landlord rental requests retrieved successfully",
        data: result
    });
});

const updateLandlordRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalService.updateLandlordRequest(
        req.params.requestId as string,
        req.user?.id as string,
        req.body,
        req.user?.role === "ADMIN"
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental request updated successfully",
        data: result
    });
});

const getAllRentalRequests = catchAsync(async (_req: Request, res: Response) => {
    const result = await rentalService.getAllRentalRequests();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental requests retrieved successfully",
        data: result
    });
});

export const rentalController = {
    createRentalRequest,
    getMyRentalRequests,
    getRentalRequestById,
    getLandlordRequests,
    updateLandlordRequest,
    getAllRentalRequests
};