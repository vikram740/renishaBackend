const mongoose = require("mongoose");

const dealsCollectionSchema = new mongoose.Schema(
    {
        dealId: {
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
            type: mongoose.Schema.Types.ObjectId,           // vikram
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
            type: Number,
        },

        installmentPaidAmount: {
            type: Number,
            required: true
        },

        primaryQRCode: {
            type: String,
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },

    },
    {
        timestamps: true
    }
);

const dealsCollectionModel = mongoose.model("dealsCollection", dealsCollectionSchema);
module.exports = dealsCollectionModel;

