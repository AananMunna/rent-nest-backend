import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { propertyService } from "./property.service";

const createProperty = catchAsync(async (req: Request, res: Response) => {
    const result = await propertyService.createProperty(req.body, req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Property created successfully",
        data: result
    });
});

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
    const result = await propertyService.getAllProperties(req.query as Record<string, unknown>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Properties retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;

    if (!propertyId) {
        throw new Error("Property id is required.");
    }

    const result = await propertyService.getPropertyById(propertyId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property retrieved successfully",
        data: result
    });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
    const result = await propertyService.updateProperty(
        req.params.propertyId as string,
        req.body,
        req.user?.id as string,
        req.user?.role === "ADMIN"
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property updated successfully",
        data: result
    });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
    await propertyService.deleteProperty(
        req.params.propertyId as string,
        req.user?.id as string,
        req.user?.role === "ADMIN"
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property deleted successfully",
        data: null
    });
});

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
    const result = await propertyService.getMyProperties(req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "My properties retrieved successfully",
        data: result
    });
});

export const propertyController = {
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    getMyProperties
};