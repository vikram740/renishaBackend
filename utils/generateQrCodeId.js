const qrCodeModel = require('../model/qrCodes_model');

function getIndianDate() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}${mm}${yyyy}`;
}

async function generateQrCodeId() {

    const indianDate = getIndianDate();

    const counter = await qrCodeModel.findOneAndUpdate(
        {
            type: "QR_COUNTER",
            todayDate: indianDate
        },
        {
            $inc: { seq: 1 }
        },
        {
            upsert: true,
            new: true
        }
    );

    return `QR${indianDate}${String(counter.seq).padStart(4, '0')}`;
}

module.exports = generateQrCodeId;


