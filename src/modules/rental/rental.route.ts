import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { rentalController } from "./rental.controller";

const router = Router();

router.post("/", auth(Role.TENANT), rentalController.createRentalRequest);
router.get("/", auth(Role.TENANT), rentalController.getMyRentalRequests);
router.get("/:requestId", auth(Role.TENANT), rentalController.getRentalRequestById);

export const rentalRoutes = router;