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
            type: Number,
        },

        amount: {
            type: Number,
        },

        primaryQRCode: {
            type: String,
        },
        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        }

      
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("dealsCollection", dealsCollectionSchema);
