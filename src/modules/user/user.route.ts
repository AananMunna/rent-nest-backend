import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { userController } from "./user.controller";

const router = Router();

router.get("/me",
auth(Role.ADMIN, Role.TENANT, Role.LANDLORD),

userController.getMyProfile);


router.put("/my-profile", auth(Role.ADMIN, Role.TENANT, Role.LANDLORD), userController.updateMyProfile);

export const userRoutes = router;