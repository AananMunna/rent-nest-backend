import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { propertyController } from "../property/property.controller";
import { rentalController } from "../rental/rental.controller";

const router = Router();

router.post("/properties", auth(Role.LANDLORD, Role.ADMIN), propertyController.createProperty);
router.put("/properties/:propertyId", auth(Role.LANDLORD, Role.ADMIN), propertyController.updateProperty);
router.delete("/properties/:propertyId", auth(Role.LANDLORD, Role.ADMIN), propertyController.deleteProperty);
router.get("/properties/mine", auth(Role.LANDLORD, Role.ADMIN), propertyController.getMyProperties);

router.get("/requests", auth(Role.LANDLORD, Role.ADMIN), rentalController.getLandlordRequests);
router.patch("/requests/:requestId", auth(Role.LANDLORD, Role.ADMIN), rentalController.updateLandlordRequest);

export const landlordRoutes = router;