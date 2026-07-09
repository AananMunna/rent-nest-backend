import { prisma } from "../../lib/prisma";
import { propertyService } from "../property/property.service";
import { rentalService } from "../rental/rental.service";

const getAllUsers = async (query: Record<string, unknown>) => {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const searchTerm = typeof query.searchTerm === "string" ? query.searchTerm : undefined;
    const role = typeof query.role === "string" ? query.role : undefined;
    const activeStatus = typeof query.activeStatus === "string" ? query.activeStatus : undefined;

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

    return {
        data: users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const updateUserStatus = async (userId: string, activeStatus: string) => {
    const user = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            activeStatus: activeStatus as any
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

    return user;
};

const getAllPropertiesForAdmin = async (query: Record<string, unknown>) => {
    return propertyService.getAllProperties(query);
};

const getAllRentalRequestsForAdmin = async () => {
    return rentalService.getAllRentalRequests();
};

export const adminService = {
    getAllUsers,
    updateUserStatus,
    getAllPropertiesForAdmin,
    getAllRentalRequestsForAdmin
};