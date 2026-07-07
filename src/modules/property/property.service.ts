import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const normalizeStringList = (value: unknown) => {
    if (!value) {
        return [] as string[];
    }

    if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item)).filter(Boolean);
            }
        } catch {
            return value.split(",").map((item) => item.trim()).filter(Boolean);
        }
    }

    return [] as string[];
};

const createProperty = async (payload: any, landlordId: string) => {
    const category = await prisma.category.findUniqueOrThrow({
        where: {
            id: payload.categoryId
        }
    });

    return prisma.property.create({
        data: {
            title: payload.title,
            description: payload.description,
            price: Number(payload.price),
            location: payload.location,
            city: payload.city,
            area: payload.area,
            bedrooms: Number(payload.bedrooms ?? 1),
            bathrooms: Number(payload.bathrooms ?? 1),
            amenities: normalizeStringList(payload.amenities),
            images: normalizeStringList(payload.images),
            isAvailable: payload.isAvailable ?? true,
            landlordId,
            categoryId: category.id
        },
        include: {
            category: true,
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            }
        }
    });
};

const buildPropertyWhere = (query: Record<string, unknown>): Prisma.PropertyWhereInput[] => {
    const andConditions: Prisma.PropertyWhereInput[] = [];

    if (query.searchTerm && typeof query.searchTerm === "string") {
        andConditions.push({
            OR: [
                { title: { contains: query.searchTerm, mode: "insensitive" } },
                { description: { contains: query.searchTerm, mode: "insensitive" } },
                { location: { contains: query.searchTerm, mode: "insensitive" } },
                { city: { contains: query.searchTerm, mode: "insensitive" } }
            ]
        });
    }

    if (query.categoryId && typeof query.categoryId === "string") {
        andConditions.push({ categoryId: query.categoryId });
    }

    if (query.city && typeof query.city === "string") {
        andConditions.push({ city: { contains: query.city, mode: "insensitive" } });
    }

    if (query.location && typeof query.location === "string") {
        andConditions.push({ location: { contains: query.location, mode: "insensitive" } });
    }

    if (query.minPrice !== undefined) {
        andConditions.push({ price: { gte: Number(query.minPrice) } });
    }

    if (query.maxPrice !== undefined) {
        andConditions.push({ price: { lte: Number(query.maxPrice) } });
    }

    if (query.isAvailable !== undefined) {
        const isAvailable = String(query.isAvailable) === "true";
        andConditions.push({ isAvailable });
    }

    if (query.amenities) {
        andConditions.push({
            amenities: {
                hasSome: normalizeStringList(query.amenities)
            }
        });
    }

    return andConditions;
};

const getAllProperties = async (query: Record<string, unknown>) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = typeof query.sortBy === "string" ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const andConditions = buildPropertyWhere(query);

    const properties = await prisma.property.findMany({
        where: {
            AND: andConditions
        },
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder
        },
        include: {
            category: true,
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
            _count: {
                select: {
                    rentalRequests: true,
                    reviews: true
                }
            }
        }
    });

    const total = await prisma.property.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: properties,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getPropertyById = async (propertyId: string) => {
    return prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId
        },
        include: {
            category: true,
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
            reviews: {
                where: {
                    isPublished: true
                },
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    rentalRequests: true,
                    reviews: true
                }
            }
        }
    });
};

const updateProperty = async (propertyId: string, payload: any, userId: string, isAdmin: boolean) => {
    const property = await prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId
        }
    });

    if (!isAdmin && property.landlordId !== userId) {
        throw new Error("You are not allowed to update this property.");
    }

    const categoryId = payload.categoryId
        ? (await prisma.category.findUniqueOrThrow({ where: { id: payload.categoryId } })).id
        : property.categoryId;

    return prisma.property.update({
        where: {
            id: propertyId
        },
        data: {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.price !== undefined ? { price: Number(payload.price) } : {}),
            ...(payload.location !== undefined ? { location: payload.location } : {}),
            ...(payload.city !== undefined ? { city: payload.city } : {}),
            ...(payload.area !== undefined ? { area: payload.area } : {}),
            ...(payload.bedrooms !== undefined ? { bedrooms: Number(payload.bedrooms) } : {}),
            ...(payload.bathrooms !== undefined ? { bathrooms: Number(payload.bathrooms) } : {}),
            ...(payload.amenities !== undefined ? { amenities: normalizeStringList(payload.amenities) } : {}),
            ...(payload.images !== undefined ? { images: normalizeStringList(payload.images) } : {}),
            ...(payload.isAvailable !== undefined ? { isAvailable: Boolean(payload.isAvailable) } : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
            categoryId
        },
        include: {
            category: true,
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            }
        }
    });
};

const deleteProperty = async (propertyId: string, userId: string, isAdmin: boolean) => {
    const property = await prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId
        }
    });

    if (!isAdmin && property.landlordId !== userId) {
        throw new Error("You are not allowed to delete this property.");
    }

    return prisma.property.delete({
        where: {
            id: propertyId
        }
    });
};

const getMyProperties = async (landlordId: string) => {
    return prisma.property.findMany({
        where: {
            landlordId
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            category: true,
            _count: {
                select: {
                    rentalRequests: true,
                    reviews: true
                }
            }
        }
    });
};

export const propertyService = {
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    getMyProperties
};