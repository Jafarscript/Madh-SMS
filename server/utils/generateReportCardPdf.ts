import puppeteer from "puppeteer";
import { buildSingleReportCardHtml, buildBulkReportCardHtml, ReportCardData } from "./reportCardTemplate";



const launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

export const generateSingleReportCardPdf = async (data: ReportCardData): Promise<Buffer> => {
  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const html = buildSingleReportCardHtml(data);
    
    // Set content and wait for network requests and fonts to finish loading
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForNetworkIdle();
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

export const generateBulkReportCardPdf = async (dataList: ReportCardData[]): Promise<Buffer> => {
  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const html = buildBulkReportCardHtml(dataList);
    
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForNetworkIdle();
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};
