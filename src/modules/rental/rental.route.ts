import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { rentalController } from "./rental.controller";

const router = Router();

router.post("/", auth(Role.TENANT, Role.ADMIN), rentalController.createRentalRequest);
router.get("/", auth(), rentalController.getMyRentalRequests);
router.get("/:requestId", auth(), rentalController.getRentalRequestById);

export const rentalRoutes = router;