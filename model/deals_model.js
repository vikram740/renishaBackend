const mongoose = require('mongoose');

const dealsSchema = new mongoose.Schema({
    type: {
        type: String,
        default: null
    },
    seq: {
        type: Number,
        default: null
    },
    dealIdNo: {
        type: String,
        unique: true,
        sparse: true
    },

    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'member',
        required: true,
        index: true
    },

    tenureType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'halfYearly', 'yearly'],
        required: true
    },

    tenurePlan: {
        type: Number
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
        type: String,
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

    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('deals', dealsSchema);
