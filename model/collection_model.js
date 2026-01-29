const mongoose = require('mongoose');

let collectionSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'member',
        required: true,
        index: true
    },
    collectionAmount: {
        type: Number,
    },
    collectionPercentage: {
        type: Number,
    },
    paymentMode: {
        type: String,
        enum: ['online', 'cash']
    },
    collectionDate: {
        type: Date,
        default: Date.now
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

const collectionModel = mongoose.model('collection', collectionSchema);
module.exports = collectionModel;

