import { RentalRequestStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createReview = async (payload: any, tenantId: string) => {
    const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: payload.rentalRequestId
        },
        include: {
            payment: true,
            review: true
        }
    });

    if (rentalRequest.tenantId !== tenantId) {
        throw new Error("You are not allowed to review this rental request.");
    }

    if (rentalRequest.status !== RentalRequestStatus.COMPLETED) {
        throw new Error("You can only review a completed rental.");
    }

    if (!rentalRequest.payment || rentalRequest.payment.status !== "COMPLETED") {
        throw new Error("A completed payment is required before leaving a review.");
    }

    if (rentalRequest.review) {
        throw new Error("You have already reviewed this rental request.");
    }

    const rating = Number(payload.rating);
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
    }

    return prisma.review.create({
        data: {
            tenantId,
            propertyId: rentalRequest.propertyId,
            rentalRequestId: rentalRequest.id,
            rating,
            comment: payload.comment
        },
        include: {
            property: true,
            tenant: {
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

const getPropertyReviews = async (propertyId: string) => {
    return prisma.review.findMany({
        where: {
            propertyId,
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
    });
};

export const reviewService = {
    createReview,
    getPropertyReviews
};