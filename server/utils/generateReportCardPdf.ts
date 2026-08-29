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
    
    // 1. Set content with an accepted lifecycle event
    await page.setContent(html, { waitUntil: "load" });
    // 2. Wait for network requests to finish if your HTML loads external fonts/images
    await page.waitForNetworkIdle();

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
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
    
    // Apply the same fix here
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForNetworkIdle();

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};
