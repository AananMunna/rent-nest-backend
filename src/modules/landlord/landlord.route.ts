import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { propertyController } from "../property/property.controller";
import { rentalController } from "../rental/rental.controller";

const router = Router();

router.post(
  "/properties",
  auth(Role.LANDLORD),
  propertyController.createProperty,
);
router.put(
  "/properties/:propertyId",
  auth(Role.LANDLORD),
  propertyController.updateProperty,
);
router.delete(
  "/properties/:propertyId",
  auth(Role.LANDLORD),
  propertyController.deleteProperty,
);
router.get(
  "/properties/mine",
  auth(Role.LANDLORD),
  propertyController.getMyProperties,
);

router.get(
  "/requests",
  auth(Role.LANDLORD, Role.ADMIN),
  rentalController.getLandlordRequests,
);
router.patch(
  "/requests/:requestId",
  auth(Role.LANDLORD),
  rentalController.updateLandlordRequest,
);

export const landlordRoutes = router;
