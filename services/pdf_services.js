const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const generateInvestmentPDF = async (data) => {
    const html = await ejs.renderFile(
        path.join(process.cwd(), "templates", "investment-deed.ejs"),
        data
    );

    const css = fs.readFileSync(
        path.join(process.cwd(), "public", "css",
            "investment.css"),
        "utf8"
    );

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // await page.setContent(html, { waitUntil: "load" });
    // await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setContent(html, { waitUntil: "load", timeout: 0 });


    await page.addStyleTag({ content: css });

    const outputPath = path.join(
        process.cwd(),
        "public",
        "pdfs",
        `investment_${Date.now()}.pdf`
    );

    await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true
    });

    await browser.close();
    return outputPath;
};

module.exports = { generateInvestmentPDF };
