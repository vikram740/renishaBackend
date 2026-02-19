const mongoose = require("mongoose");

const dealsCollectionDraftSchema = new mongoose.Schema(
    {

        // 🔥 Link to original payment (optional but recommended)
        originalPaymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dealsCollection",
            index: true
        },

        // 🔥 Link to original deal
        originalDealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "deals",
            required: true,
            index: true
        },

        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "member",
            required: true,
            index: true
        },

        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "agent",
            required: true,
            index: true
        },

        paymentMode: {
            type: String,
            enum: ["online", "cash"],
            required: true
        },

        upiTransactionId: {
            type: String,
            default: "CASH",
            required: true
        },

        installmentNumber: {
            type: Number
        },

        installmentPaidAmount: {
            type: Number,
            required: true
        },

        primaryQRCode: {
            type: String
        },

        // ❌ REMOVE unique constraint here
        transactionId: {
            type: String,
            sparse: true,
            index: true
        },

        // Optional if you want to store edited interest
        interestAmount: {
            type: Number,
            default: 0
        },

        isDraft: {
            type: Boolean,
            default: true
        }

    },
    {
        timestamps: true
    }
);

const dealsCollectionDraftModel = mongoose.model("dealscollectiondraft", dealsCollectionDraftSchema);

module.exports = dealsCollectionDraftModel;