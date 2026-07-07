import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await categoryService.createCategory(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Category created successfully",
        data: result
    });
});

const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
    const result = await categoryService.getAllCategories();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Categories retrieved successfully",
        data: result
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryId = Array.isArray(req.params.categoryId) ? req.params.categoryId[0] : req.params.categoryId;

    if (!categoryId) {
        throw new Error("Category id is required.");
    }

    const result = await categoryService.updateCategory(categoryId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category updated successfully",
        data: result
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryId = Array.isArray(req.params.categoryId) ? req.params.categoryId[0] : req.params.categoryId;

    if (!categoryId) {
        throw new Error("Category id is required.");
    }

    await categoryService.deleteCategory(categoryId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category deleted successfully",
        data: null
    });
});

export const categoryController = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};