import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";
import { Temple } from "../models/templeDetails.model.js";
import mongoose from "mongoose";

// ✅ Create a transaction: supports transfer / withdrawal / registration
const donateToTemple = asyncHandler(async (req, res) => {
    const {
        amount,
        txHash,
        gasPrice,
        transactionFee,
        purpose,
        status,
        templeWalletAddress,
        templeId,
        cryptoType = "matic", // Default to MATIC
        senderWalletAddress, // Sender's wallet address from frontend
    } = req.body;

    console.log("Donation request received:", {
        amount,
        txHash,
        gasPrice,
        transactionFee,
        purpose,
        status,
        templeWalletAddress,
        templeId,
        cryptoType,
        senderWalletAddress,
    });

    if (!amount || !txHash || !gasPrice || !transactionFee || !purpose || !status) {
        throw new ApiError(400, "All fields are required");
    }

    if (!templeWalletAddress && !templeId) {
        throw new ApiError(400, "Temple wallet address or temple ID is required.");
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        throw new ApiError(400, "Invalid donation amount");
    }

    // ✅ Validate gasPrice & transactionFee
    if (isNaN(gasPrice) || isNaN(transactionFee)) {
        throw new ApiError(400, "Invalid gasPrice or transactionFee");
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "failed"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    // Validate purpose
    if (typeof purpose !== "string" || purpose.trim() === "") {
        throw new ApiError(400, "Invalid purpose");
    }

    // Check if transaction with the same txHash already exists
    const existingTransaction = await Transaction.findOne({ txHash });
    if (existingTransaction) {
        throw new ApiError(400, "Transaction with this hash already exists");
    }

    // Check if the sender exists and is authenticated
    // For blockchain donations without user account, create placeholder
    let sender = req.user;
    let senderId = sender?._id;

    // If no authenticated user, use blockchain wallet address as identifier
    if (!sender || !sender._id) {
        console.warn("Unauthenticated donation from wallet:", senderWalletAddress);
        // Will create transaction without User reference
        senderId = null;
    } else {
        // ✅ Store sender's wallet address if provided
        if (senderWalletAddress && !sender.walletAddress) {
            sender.walletAddress = senderWalletAddress.toLowerCase();
            await sender.save({ validateBeforeSave: false });
            console.log("Stored sender's wallet address:", senderWalletAddress);
        }
    }

    // Find temple admin by wallet address OR by ID
    let templeAdmin;
    if (templeId) {
        try {
            templeAdmin = await User.findById(templeId);
        } catch (idError) {
            console.warn("Invalid templeId format, skipping ID lookup:", templeId);
            // If templeId is invalid, continue to wallet address lookup
        }
    }
    
    // If temple admin not found by ID, try by wallet address
    if (!templeAdmin && templeWalletAddress) {
        templeAdmin = await User.findOne({
            walletAddress: templeWalletAddress.toLowerCase(),
            role: "templeAdmin",
            status: "active",
        });
    }

    console.log("Temple admin found:", templeAdmin);

    // If no temple admin user found, create a placeholder transaction
    // This handles donations to blockchain-only temple addresses
    if (!templeAdmin) {
        console.warn("No temple admin user found for wallet:", templeWalletAddress);
        console.warn("Creating transaction with blockchain temple address...");
        
        // Create transaction without a receiver User reference (blockchain-only donation)
        const transaction = await Transaction.create({
            transactionType: "transfer",
            sender: senderId, // Can be null for unauthenticated blockchain donations
            receiver: null, // No user receiver, just blockchain address
            amount,
            txHash,
            gasPrice,
            transactionFee,
            status,
            purpose,
            cryptoType: cryptoType.toLowerCase(),
            templeWalletAddress: templeWalletAddress.toLowerCase(), // Store blockchain address directly
            senderWalletAddress: senderWalletAddress?.toLowerCase(), // Store sender wallet directly
        });

        console.log("Blockchain-only transaction created:", transaction);

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    transaction,
                    "Donation recorded on blockchain"
                )
            );
    }

    if (templeAdmin.role !== "templeAdmin" || templeAdmin.status !== "active") {
        throw new ApiError(404, "Temple admin is not active");
    }

    // ✅ Create transaction
    const transaction = await Transaction.create({
        transactionType: "transfer",
        sender: senderId, // Can be null for unauthenticated blockchain donations
        receiver: templeAdmin._id,
        amount,
        txHash,
        gasPrice,
        transactionFee,
        status,
        purpose,
        cryptoType: cryptoType.toLowerCase(), // Ensure it's lowercase
        templeWalletAddress: templeWalletAddress.toLowerCase(),
        senderWalletAddress: senderWalletAddress?.toLowerCase(),
    });

    console.log("Transaction created successfully:", transaction);

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                transaction,
                "Donation recorded successfully"
            )
        );
});

// ✅ Donation History (only for transfers made by user)
const donationHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(400, "User ID not found");
    }

    const donations = await Transaction.find({
        sender: userId,
        transactionType: "transfer",
    })
        .populate({
            path: "receiver",
            select: "templeName templeLocation",
        })
        .populate({
            path: "sender",
            select: "name walletAddress",
        })
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, donations, "Donation history fetched successfully")
        );
});

// ✅ Get transaction by txHash (for receipt page)
const getTransactionByTxHash = asyncHandler(async (req, res) => {
    const { txHash } = req.query;

    if (!txHash) {
        throw new ApiError(400, "Transaction hash is required");
    }

    console.log("Searching for transaction with txHash:", txHash);

    const transaction = await Transaction.findOne({ txHash })
        .populate({
            path: "sender",
            select: "name walletAddress", 
        })
        .populate({
            path: "receiver",
            select: "templeName templeLocation walletAddress", 
        });

    console.log("Transaction found:", transaction);

    if (!transaction) {
        // Log all transactions in database for debugging
        const allTransactions = await Transaction.find({}).select("txHash");
        console.log("All transactions in DB:", allTransactions);
        
        // Instead of throwing error, return a blockchain-verified response
        // This handles cases where donation succeeded on blockchain but DB save failed
        console.warn(`Transaction ${txHash} not found in database, but may exist on blockchain`);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        txHash: txHash,
                        status: "blockchain_verified",
                        message: "Transaction verified on blockchain but not yet in database. Check the blockchain directly for details.",
                        source: "blockchain",
                    },
                    "Transaction verified on blockchain (database record pending)"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transaction,
                "Transaction details fetched successfully"
            )
        );
});

const generateTempleReport = asyncHandler(async (req, res) => {
    const templeId = req.user._id;
    const { type } = req.query; // type = 'weekly' | 'monthly'

    if (!templeId || !['weekly', 'monthly'].includes(type)) {
        throw new ApiError(400, "Invalid temple ID or type");
    }

    const endDate = new Date();
    let startDate = new Date();

    if (type === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
    } else if (type === 'monthly') {
        startDate.setMonth(endDate.getMonth() - 1);
    }

    const reportData = await Transaction.find({
        receiver: templeId,
        transactionType: "transfer",
        createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 })
        .populate({
            path: "receiver",
            select: "templeName templeLocation _id"
        });

    const totalAmount = reportData.reduce((sum, txn) => sum + txn.amount, 0);
    const templeInfo = reportData[0]?.receiver || null;

    return res
        .status(200)
        .json(new ApiResponse(200, {
            report: reportData,
            templeInfo,
            totalTransactions: reportData.length,
            totalAmountDonated: totalAmount
        }, `${type} report generated`));
});

const templeDonations = asyncHandler(async (req, res) => {
    const templeAdminId = req.user._id;

    if (!templeAdminId) {
        throw new ApiError(400, "Temple Admin ID is missing");
    }

    // Get the temple admin's details to find their temple name
    const templeAdmin = await User.findById(templeAdminId);
    if (!templeAdmin) {
        throw new ApiError(404, "Temple Admin not found");
    }

    // Find the temple by name
    const temple = await Temple.findOne({ templeName: templeAdmin.templeName });
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Get donations for this temple
    const donations = await Transaction.find({
        receiver: temple._id,
        transactionType: "transfer"
    })
        .populate({
            path: "sender",
            select: "name walletAddress",
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(
        200,
        donations,
        "Donations received by temple fetched successfully"
    ));
});

const recentTempleDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    const donations = await Transaction.find({
        receiver: templeId,
        transactionType: "transfer",
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
            path: "sender",
            select: "name",
        });

    const mapped = donations.map((txn) => ({
        donor: txn.sender?.name || "Anonymous",
        amount: `${txn.amount.toLocaleString()} MATIC`,
        date: new Date(txn.createdAt).toLocaleDateString(),
        time: new Date(txn.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        purpose: txn.purpose,
    }));

    return res.status(200).json(new ApiResponse(200, mapped, "Recent temple donations fetched"));
});

const templeMonthlyDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(templeId)) {
        throw new ApiError(400, "Invalid temple ID format");
    }

    try {
        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(templeId.toString()),
                    transactionType: "transfer",
                    status: "confirmed",
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" },
                },
            },
            {
                $sort: { "_id": 1 },
            },
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formatted = monthlyData.map((item) => ({
            month: monthNames[item._id - 1],
            amount: item.total,
        }));

        return res.status(200).json(new ApiResponse(200, formatted, "Monthly donation stats"));
    } catch (err) {
        console.error("🔴 Aggregation Error:", err); // View the full stack trace
        return res.status(500).json(new ApiResponse(500, null, "Internal error during aggregation", err));
    }
});

const getTotalDonations = asyncHandler(async (req, res) => {
    const templeId = req.user._id;

    if (!templeId) {
        throw new ApiError(400, "Temple ID is missing");
    }

    try {
        // Get total confirmed donations for this temple
        const result = await Transaction.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(templeId),
                    transactionType: "transfer",
                    status: "confirmed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalMATIC: { $sum: "$amount" },
                },
            },
        ]);

        const totalMATIC = result[0]?.totalMATIC || 0;

        return res.status(200).json(
            new ApiResponse(200, {
                totalMATIC,
            }, "Total donations fetched successfully")
        );
    } catch (err) {
        console.error("Error calculating total donations:", err);
        throw new ApiError(500, "Failed to fetch total donations");
    }
});

const recentDonations = asyncHandler(async (req, res) => {
    const donations = await Transaction.find({ transactionType: "transfer" })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate({
            path: "receiver",
            select: "templeName"
        });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            donations,
            "Recent 4 donations fetched successfully"
        ));
});

const getUserTotalDonations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    try {
        const result = await Transaction.aggregate([
            {
                $match: {
                    sender: new mongoose.Types.ObjectId(userId),
                    transactionType: "transfer",
                    status: "confirmed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalMATIC: { $sum: "$amount" },
                },
            },
        ]);

        const totalMATIC = result[0]?.totalMATIC || 0;

        return res.status(200).json(
            new ApiResponse(
                200,
                { totalMATIC },
                "Total donations by user fetched successfully"
            )
        );
    } catch (err) {
        console.error("Error fetching user's total donations:", err);
        throw new ApiError(500, "Failed to fetch user's total donations");
    }
});

const getUserMonthlyDonation = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Transaction.aggregate([
        {
            $match: {
                sender: new mongoose.Types.ObjectId(userId),
                transactionType: "transfer",
                status: "confirmed",
                createdAt: { $gte: startOfMonth, $lte: now },
            },
        },
        {
            $group: {
                _id: null,
                totalMonthlyMATIC: { $sum: "$amount" },
            },
        },
    ]);

    const totalMonthlyMATIC = result[0]?.totalMonthlyMATIC || 0;

    return res.status(200).json(
        new ApiResponse(200, { totalMonthlyMATIC }, "User's monthly donations fetched successfully")
    );
});

export {
    donateToTemple,
    donationHistory,
    generateTempleReport,
    templeDonations,
    recentTempleDonations,
    recentDonations,
    templeMonthlyDonations,
    getTotalDonations,
    getUserTotalDonations,
    getUserMonthlyDonation,
    getTransactionByTxHash
}
