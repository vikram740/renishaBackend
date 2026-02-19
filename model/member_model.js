const mongoose = require('mongoose');

let memberSchema = new mongoose.Schema({
    type: {
        type: String,
        default: null
    },
    seq: {
        type: Number,
        default: null
    },

    memberIdNo: {
        type: String,
        unique: true,
        sparse: true
    },

    memberName: {
        type: String,
        required: true
    },
    memberBirth: {
        type: String,
        required: true
    },
    memberAdhaar: {
        type: String,
        unique: true,
        sparse: true
    },
    memberPan: {
        type: String,
        unique: true,
        sparse: true
    },
    memberPhone: {
        type: String,
        unique: true,
        sparse: true
    },
    memberEmail: {
        type: String,
        required: true,
        unique: true,
    },
    memberCurrentAddress: {
        type: String,
    },
    memberPermanentAddress: {
        type: String,
    },
    uploadMemberAdhaar: {
        type: String
    },
    uploadMemberPan: {
        type: String
    },
    memberJoiningDate: {
        type: String
    },
    memberSignature: {
        type: String,
    },
    memberPhoto: {
        type: String,
    },
    adminId: {
        type: mongoose.Types.ObjectId,
        ref: "admin",
        index: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
})

const memberModel = mongoose.model('member', memberSchema);
module.exports = memberModel;

