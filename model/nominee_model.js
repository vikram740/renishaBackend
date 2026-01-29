const mongoose = require("mongoose");

let nomineeSchema = new mongoose.Schema({

    nomineeName: {
        type: String,
        required: true
    },
    nomineeBirth: {
        type: String,
        required: true
    },
    nomineeAdhaar: {
        type: String,
        unique: true
    },
    nomineePhone: {
        type: String,
        unique: true
    },
    nomineeEmail: {
        type: String,
        required: true,
        unique: true,
    },
    nomineeCurrentAddress: {
        type: String,
    },
    nomineePermanentAddress: {
        type: String,
    },
    nomineeRelationship: {
        type: String,
    },
    nomineeSignature: {
        type: String,
    },
    nomineePhoto: {
        type: String,
    },
    memberId: {
        type: mongoose.Types.ObjectId
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
})

const nomineeModel = mongoose.model('nominee', nomineeSchema);
module.exports = nomineeModel