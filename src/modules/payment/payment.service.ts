import { randomUUID } from "crypto";
import {
  PaymentStatus,
  RentalRequestStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

const createPayment = async (
  payload: any,
  userId: string,
  isAdmin: boolean,
) => {
  const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
    where: {
      id: payload.rentalRequestId,
    },
    include: {
      property: true,
      payment: true,
    },
  });

  if (!isAdmin && rentalRequest.tenantId !== userId) {
    throw new Error("You are not allowed to pay for this request.");
  }

  if (
    rentalRequest.status !== RentalRequestStatus.APPROVED &&
    rentalRequest.status !== RentalRequestStatus.ACTIVE
  ) {
    throw new Error(
      "Payment is only allowed after the rental request has been approved.",
    );
  }

  if (rentalRequest.payment) {
    return rentalRequest.payment;
  }

  const payment = await prisma.payment.create({
    data: {
      transactionId: payload.transactionId ?? randomUUID(),
      rentalRequestId: rentalRequest.id,
      tenantId: rentalRequest.tenantId,
      propertyId: rentalRequest.propertyId,
      amount: rentalRequest.property.price,
      method: payload.method ?? "card",
      provider: "STRIPE",
      status: PaymentStatus.PENDING,
    },
    include: {
      rentalRequest: {
        include: {
          property: true,
        },
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: payment.currency.toLowerCase(),
          product_data: {
            name: payment.rentalRequest.property.title,
          },
          unit_amount: payment.amount * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${config.app_url}/payments?success=true&paymentId=${payment.id}`,
    cancel_url: `${config.app_url}/payments?success=false&paymentId=${payment.id}`,
    metadata: {
      paymentId: payment.id,
      rentalRequestId: rentalRequest.id,
      tenantId: rentalRequest.tenantId,
      propertyId: rentalRequest.propertyId,
    },
  });

  return prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      gatewayUrl: session.url ?? undefined,
      transactionId: session.id,
    },
    include: {
      rentalRequest: {
        include: {
          property: true,
        },
      },
    },
  });
};

const confirmPayment = async (payload: any) => {
  const payment = await prisma.payment.findFirstOrThrow({
    where: payload.paymentId
      ? { id: payload.paymentId }
      : { transactionId: payload.transactionId },
  });

  const nextStatus = String(payload.status ?? "COMPLETED").toUpperCase();
  const status =
    nextStatus === "FAILED" ? PaymentStatus.FAILED : PaymentStatus.COMPLETED;

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status,
        paidAt: status === PaymentStatus.COMPLETED ? new Date() : null,
        verifiedAt: status === PaymentStatus.COMPLETED ? new Date() : null,
      },
      include: {
        rentalRequest: {
          include: {
            property: true,
          },
        },
      },
    });

    if (status === PaymentStatus.COMPLETED) {
      await tx.rentalRequest.update({
        where: {
          id: payment.rentalRequestId,
        },
        data: {
          status: RentalRequestStatus.ACTIVE,
        },
      });
    }

    return updatedPayment;
  });
};

const handleStripeWebhook = async (payload: Buffer, signature: string) => {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe_webhook_secret,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;

    if (paymentId) {
      await confirmPayment({ paymentId, status: "COMPLETED" });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;

    if (paymentId) {
      await confirmPayment({ paymentId, status: "FAILED" });
    }
  }
};

const getPaymentHistory = async (userId: string, isAdmin: boolean) => {
  return prisma.payment.findMany({
    where: isAdmin ? {} : { tenantId: userId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      rentalRequest: {
        include: {
          property: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
};

const getPaymentById = async (
  paymentId: string,
  userId: string,
  isAdmin: boolean,
) => {
  const payment = await prisma.payment.findUniqueOrThrow({
    where: {
      id: paymentId,
    },
    include: {
      rentalRequest: {
        include: {
          property: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!isAdmin && payment.tenantId !== userId) {
    throw new Error("You are not allowed to view this payment.");
  }

  return payment;
};

export const paymentService = {
  createPayment,
  handleStripeWebhook,
  confirmPayment,
  getPaymentHistory,
  getPaymentById,
};
