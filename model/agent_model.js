const mongoose = require('mongoose');

let agentSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "AGENT",
        index: true
    },

    seq: {
        type: Number,
        default: 0
    },

    agentIdNo: {
        type: String,
        unique: true,
        sparse: true
    },

    agentName: {
        type: String,
        required: true
    },
    agentBirth: {
        type: String,
        required: true
    },
    agentEmail: {
        type: String,
        required: true,
        unique: true
    },
    agentAdhaar: {
        type: String,
        unique: true,
        sparse: true
    },
    agentPan: {
        type: String,
        unique: true,
        sparse: true
    },
    agentPhone: {
        type: String,
        unique: true,
        sparse: true
    },

    agentCurrentAddress: {
        type: String
    },
    agentPermanentAddress: {
        type: String
    },
    agentuserName: {
        type: String,
        required: true
    },
    agentPassword: {
        type: String,
        required: true
    },
    agentSignature: {
        type: String
    },
    agentPhoto: {
        type: String
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});
const agentModel = mongoose.model('agent', agentSchema);
module.exports = agentModel;
