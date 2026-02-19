const mongoose = require('mongoose');

let referralSchema = new mongoose.Schema({
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agent',
        required: true,
        index: true
    },
    referredPlan: {
        type: String,
    },
    referredAmount: {
        type: Number,
    },
    referredPaid: {
        type: Number,
    },
    referredPending: {
        type: Number,
    },

    createdOn: {
        type: Date,
        default: Date.now
    }
})

const referralModel = mongoose.model('referral', referralSchema);
module.exports = referralModel;

