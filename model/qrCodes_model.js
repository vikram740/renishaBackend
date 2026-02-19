const mongoose = require('mongoose');

let qrCodeSchema = new mongoose.Schema({
    type: {
        type: String,
        default: null
    },
    seq: {
        type: Number,
        default: null
    },

    qrCodeIdNo: {
        type: String,
        unique: true,
        sparse: true
    },

    qrCodeFileName: {
        type: String,
    },
    qrCodeFile: {
        type: String,
    },
    todayDate: {
        type: String,
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

const qrCodeModel = mongoose.model('qrCode', qrCodeSchema);
module.exports = qrCodeModel;
