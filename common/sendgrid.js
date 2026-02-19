
const sgMail = require('@sendgrid/mail');
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendGrid = (to, _id, token) => {
    return sgMail.send({
        to,
        from: process.env.SENDGRID_FROM,
        subject: "Forgot Password",
        // text: "Click the link below to reset your password",
        html: `
            <p>You requested a password reset</p>
            <a href="${process.env.REDIRECT_URL || process.env.SERVER_REDIRECT_URL}/resetPassword/${_id}/${encodeURIComponent(token)}" target="_blank">
                Click here to reset your password
            </a>
            <p>This link will expire in 15 minutes</p>
        `
    });
};

module.exports = { sendGrid };
