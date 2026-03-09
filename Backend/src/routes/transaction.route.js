import { Router } from "express";
import {
    donateToTemple,
    donationHistory,
    getTransactionByTxHash,
    generateTempleReport,
    templeDonations,
    recentTempleDonations,
    recentDonations,
    templeMonthlyDonations,
    getTotalDonations,
    getUserTotalDonations,
    getUserMonthlyDonation
} from "../controllers/transaction.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();    

// Blockchain donations allow unauthenticated requests (optional JWT)
router.route("/donate-to-temple").post(verifyJWTOptional, donateToTemple);

// All other routes require authentication
router.route("/my-donations").get(verifyJWT, authorizeRoles("user"), donationHistory);
router.get("/receipt", verifyJWTOptional, getTransactionByTxHash);
router.route("/generate-temple-report").get(verifyJWT, authorizeRoles("templeAdmin"), generateTempleReport);
router.route("/temple-donations").get(verifyJWT, authorizeRoles("templeAdmin"), templeDonations);
router.route("/recent-temple-donations").get(verifyJWT, authorizeRoles("templeAdmin"), recentTempleDonations);
router.route("/recent-donations").get(recentDonations);
router.route("/temple-monthly-donations").get(verifyJWT, authorizeRoles("templeAdmin"), templeMonthlyDonations);
router.route("/temple-total-donations").get(verifyJWT, authorizeRoles("templeAdmin"), getTotalDonations);
router.route("/total-donation-done").get(verifyJWT, authorizeRoles("user"), getUserTotalDonations);
router.route("/temple-donated-amount").get(verifyJWT, authorizeRoles("user"), getUserMonthlyDonation);

export default router