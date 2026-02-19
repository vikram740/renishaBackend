const mongoose = require("mongoose");

let userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['agent', 'admin', 'member'],
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const userModel = mongoose.model("user", userSchema);
module.exports = userModel