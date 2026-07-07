import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { authRoutes } from "./modules/auth/auth.routes";
import { adminRoutes } from "./modules/admin/admin.route";
import { categoryRoutes } from "./modules/category/category.route";
import { landlordRoutes } from "./modules/landlord/landlord.route";
import { paymentRoutes } from "./modules/payment/payment.route";
import { propertyRoutes } from "./modules/property/property.route";
import { rentalRoutes } from "./modules/rental/rental.route";
import { reviewRoutes } from "./modules/review/review.route";
import { userRoutes } from "./modules/user/user.route";



const app : Application = express();

app.use(cors({
    origin : config.app_url,
    credentials : true,
}))

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());


app.get("/",(req : Request, res : Response) => {
    res.send("Hello, World!");
});

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/properties", propertyRoutes)
app.use("/api/landlord", landlordRoutes)
app.use("/api/rentals", rentalRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/admin", adminRoutes)


app.use(notFound)

app.use(globalErrorHandler)

export default app;