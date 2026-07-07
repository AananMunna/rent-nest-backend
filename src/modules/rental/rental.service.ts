import { RentalRequestStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createRentalRequest = async (payload: any, tenantId: string) => {
    const property = await prisma.property.findUniqueOrThrow({
        where: {
            id: payload.propertyId
        }
    });

    if (!property.isAvailable && property.status !== "AVAILABLE") {
        throw new Error("This property is not available for new rental requests.");
    }

    const existingRequest = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: property.id,
            status: {
                in: [RentalRequestStatus.PENDING, RentalRequestStatus.APPROVED, RentalRequestStatus.ACTIVE]
            }
        }
    });

    if (existingRequest) {
        throw new Error("You already have an active request for this property.");
    }

    return prisma.rentalRequest.create({
        data: {
            propertyId: property.id,
            tenantId,
            landlordId: property.landlordId,
            moveInDate: new Date(payload.moveInDate),
            moveOutDate: payload.moveOutDate ? new Date(payload.moveOutDate) : undefined,
            message: payload.message
        },
        include: {
            property: {
                include: {
                    category: true
                }
            },
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
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

const getMyRentalRequests = async (userId: string, role?: string) => {
    const where = role === "LANDLORD"
        ? { landlordId: userId }
        : role === "ADMIN"
            ? {}
            : { tenantId: userId };

    return prisma.rentalRequest.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        include: {
            property: {
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
            },
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
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
            payment: true,
            review: true
        }
    });
};

const getRentalRequestById = async (requestId: string, userId: string, role?: string) => {
    const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: requestId
        },
        include: {
            property: {
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
            },
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
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
            payment: true,
            review: true
        }
    });

    const isAdmin = role === "ADMIN";
    const isTenant = rentalRequest.tenantId === userId;
    const isLandlord = rentalRequest.landlordId === userId;

    if (!isAdmin && !isTenant && !isLandlord) {
        throw new Error("You are not allowed to view this rental request.");
    }

    return rentalRequest;
};

const getLandlordRequests = async (landlordId: string) => {
    return prisma.rentalRequest.findMany({
        where: {
            landlordId
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            property: {
                include: {
                    category: true
                }
            },
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
            payment: true,
            review: true
        }
    });
};

const updateLandlordRequest = async (requestId: string, landlordId: string, payload: any, isAdmin: boolean) => {
    const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: requestId
        },
        include: {
            property: true,
            payment: true
        }
    });

    if (!isAdmin && rentalRequest.landlordId !== landlordId) {
        throw new Error("You are not allowed to manage this rental request.");
    }

    const nextStatus = payload.status as RentalRequestStatus;

    if (nextStatus === RentalRequestStatus.APPROVED) {
        return prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.rentalRequest.update({
                where: {
                    id: requestId
                },
                data: {
                    status: RentalRequestStatus.APPROVED,
                    approvedAt: new Date()
                },
                include: {
                    property: true,
                    tenant: true,
                    landlord: true,
                    payment: true,
                    review: true
                }
            });

            await tx.property.update({
                where: {
                    id: rentalRequest.propertyId
                },
                data: {
                    status: "RESERVED",
                    isAvailable: false
                }
            });

            return updatedRequest;
        });
    }

    if (nextStatus === RentalRequestStatus.REJECTED) {
        return prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.rentalRequest.update({
                where: {
                    id: requestId
                },
                data: {
                    status: RentalRequestStatus.REJECTED,
                    rejectedAt: new Date()
                },
                include: {
                    property: true,
                    tenant: true,
                    landlord: true,
                    payment: true,
                    review: true
                }
            });

            await tx.property.update({
                where: {
                    id: rentalRequest.propertyId
                },
                data: {
                    status: "AVAILABLE",
                    isAvailable: true
                }
            });

            return updatedRequest;
        });
    }

    if (nextStatus === RentalRequestStatus.COMPLETED) {
        return prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.rentalRequest.update({
                where: {
                    id: requestId
                },
                data: {
                    status: RentalRequestStatus.COMPLETED,
                    completedAt: new Date()
                },
                include: {
                    property: true,
                    tenant: true,
                    landlord: true,
                    payment: true,
                    review: true
                }
            });

            await tx.property.update({
                where: {
                    id: rentalRequest.propertyId
                },
                data: {
                    status: "AVAILABLE",
                    isAvailable: true
                }
            });

            return updatedRequest;
        });
    }

    return prisma.rentalRequest.update({
        where: {
            id: requestId
        },
        data: {
            status: nextStatus
        },
        include: {
            property: true,
            tenant: true,
            landlord: true,
            payment: true,
            review: true
        }
    });
};

const getAllRentalRequests = async () => {
    return prisma.rentalRequest.findMany({
        orderBy: {
            createdAt: "desc"
        },
        include: {
            property: {
                include: {
                    category: true
                }
            },
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    avatarUrl: true
                }
            },
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
            payment: true,
            review: true
        }
    });
};

export const rentalService = {
    createRentalRequest,
    getMyRentalRequests,
    getRentalRequestById,
    getLandlordRequests,
    updateLandlordRequest,
    getAllRentalRequests
};