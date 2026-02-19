const path = require("path");
const dealsModel = require("../model/deals_model");
const memberModel = require("../model/member_model");
const nomineeModel = require("../model/nominee_model");
const { generateInvestmentPDF } = require("../services/pdf_services");
const { ObjectId } = require("mongoose").Types;
const fs = require("fs");

const safeImage = (img) => {
    if (!img) return null;
    const fullPath = path.join(__dirname, "../uploads", img);
    if (!fs.existsSync(fullPath)) return null;
    const ext = path.extname(img).slice(1);
    const data = fs.readFileSync(fullPath).toString("base64");
    return `data:image/${ext};base64,${data}`;
};

const formatIndianDate = (date) => {
    if (!date) return "";
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};


const generatePDFController = async (req, res) => {
    try {
        const { dealId, memberId, nomineeId } = req.params;

        /* ---------- Fetch deal ---------- */
        const deal = await dealsModel.findById(dealId);
        if (!deal) {
            return res.status(404).json({ message: "Deal not found" });
        }

        /* ---------- Fetch member ---------- */
        const member = await memberModel.findById(memberId);
        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        /* ---------- Fetch nominee ---------- */
        const nominee = await nomineeModel.findById(nomineeId);
        if (!nominee) {
            return res.status(404).json({ message: "Nominee not found" });
        }

        /* ---------- Calculate return (example) ---------- */
        const totalReturn =
            deal.tenureAmount +
            (deal.tenureAmount * deal.percentage) / 100;

        /* ---------- PDF DATA (FINAL) ---------- */
        const pdfData = {
            documentNo: `${deal.dealIdNo}-${member.memberIdNo}`,

            // cssPath,

            investorName: member.memberName,
            investorAadhaar: member.memberAdhaar,
            investorAddress: member.memberCurrentAddress || "",
            investorPhoto: safeImage(member.memberPhoto),

            nomineeName: nominee.nomineeName,
            nomineeAadhaar: nominee.nomineeAdhaar,
            nomineeAddress: nominee.nomineeCurrentAddress || "",
            nomineePhoto: safeImage(nominee.nomineePhoto),

            investmentAmount: deal.tenureAmount,
            tenure: deal.tenurePlan,
            // startDate: deal.fromDate.toDateString(),
            // endDate: deal.endDate.toDateString(),
            startDate: formatIndianDate(deal.fromDate),
            endDate: formatIndianDate(deal.endDate),
            totalReturn
        };

        const pdfPath = await generateInvestmentPDF(pdfData);
        return res.download(pdfPath);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: err.message || "PDF generation failed"
        });
    }
};

module.exports = { generatePDFController };
