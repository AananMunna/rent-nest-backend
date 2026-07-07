import { Router } from "express";
import { propertyController } from "./property.controller";

const router = Router();

router.get("/", propertyController.getAllProperties);
router.get("/:propertyId", propertyController.getPropertyById);

export const propertyRoutes = router;