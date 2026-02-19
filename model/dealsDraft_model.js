const mongoose = require('mongoose');

const dealsDraftSchema = new mongoose.Schema({

    originalDealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "deals",
        required: true,
        index: true
    },

    type: {
        type: String,
        default: null
    },

    seq: {
        type: Number,
        default: null
    },

    dealIdNo: {
        type: String
    },

    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'member',
        required: true,
        index: true
    },

    tenureType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'halfyearly', 'yearly'],
        required: true
    },

    tenurePlan: {
        type: Number,
    },

    fromDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    agentNameId: {
        type: String
    },

    tenureAmount: {
        type: Number,
        required: true
    },

    percentage: {
        type: Number,
        required: true
    },

    tenureInstallment: {
        type: Number,
        required: true
    },

    paidInstallments: [
        {
            installmentNumber: Number,
            amount: Number,
            paymentMode: String,
            paidOn: Date
        }
    ],

    totalInstallmentsPaid: {
        type: Number,
        default: 0
    },

    totalPaidAmount: {
        type: Number,
        default: 0
    },

    balanceAmount: {
        type: Number,
        default: 0
    },

    walletAmount: {
        type: Number,
        default: 0
    },

    lastPaidDate: {
        type: Date,
        default: null
    },

    lastInterestDate: {
        type: Date,
        default: null
    },

    interestHistory: [
        {
            date: {
                type: Date,
                required: true
            },
            interest: {
                type: Number,
                required: true
            },
            walletAfterInterest: {
                type: Number,
                required: true
            }
        }
    ],

    status: {
        type: String,
        enum: ["ACTIVE", "COMPLETED"],
        default: "ACTIVE"
    },

    // mark as draft
    isDraft: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const dealsDraftModel = mongoose.model('dealsDraft', dealsDraftSchema);

module.exports = dealsDraftModel;