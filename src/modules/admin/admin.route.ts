import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { auth } from "../../middlewares/auth";
import { catchAsync } from "../../utils/catchAsync";
import { propertyService } from "../property/property.service";
import { rentalService } from "../rental/rental.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";

const router = Router();

router.get("/users", auth(Role.ADMIN), catchAsync(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    const searchTerm = typeof req.query.searchTerm === "string" ? req.query.searchTerm : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const activeStatus = typeof req.query.activeStatus === "string" ? req.query.activeStatus : undefined;

    const where = {
        AND: [
            searchTerm
                ? {
                      OR: [
                          { name: { contains: searchTerm, mode: "insensitive" as const } },
                          { email: { contains: searchTerm, mode: "insensitive" as const } }
                      ]
                  }
                : {},
            role ? { role: role as any } : {},
            activeStatus ? { activeStatus: activeStatus as any } : {}
        ]
    };

    const users = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            name: true,
            email: true,
            activeStatus: true,
            role: true,
            phone: true,
            avatarUrl: true,
            address: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    properties: true,
                    tenantRentalRequests: true,
                    landlordRentalRequests: true,
                    payments: true,
                    reviews: true
                }
            }
        }
    });

    const total = await prisma.user.count({ where });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Users retrieved successfully",
        data: users,
        meta: {
            page,
            limit,
            total
        }
    });
}));

router.patch("/users/:id", auth(Role.ADMIN), catchAsync(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId) {
        throw new Error("User id is required.");
    }

    const user = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            activeStatus: req.body.activeStatus
        },
        select: {
            id: true,
            name: true,
            email: true,
            activeStatus: true,
            role: true,
            phone: true,
            avatarUrl: true,
            address: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User status updated successfully",
        data: user
    });
}));

router.get("/properties", auth(Role.ADMIN), catchAsync(async (req: Request, res: Response) => {
    const result = await propertyService.getAllProperties(req.query as Record<string, unknown>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Properties retrieved successfully",
        data: result.data,
        meta: result.meta
    });
}));

router.get("/rentals", auth(Role.ADMIN), catchAsync(async (_req: Request, res: Response) => {
    const result = await rentalService.getAllRentalRequests();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental requests retrieved successfully",
        data: result
    });
}));

export const adminRoutes = router;