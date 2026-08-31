import { buildSingleReportCardHtml, buildBulkReportCardHtml, ReportCardData } from "./reportCardTemplate";

const launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process", "--no-zygote"],
};

export const generateSingleReportCardPdf = async (data: ReportCardData): Promise<Buffer | null> => {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch(launchOptions);
    try {
      const page = await browser.newPage();
      const html = buildSingleReportCardHtml(data);
      
      await page.setContent(html, { waitUntil: "load" });
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
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", (err as Error).message);
    return null;
  }
};

export const generateBulkReportCardPdf = async (dataList: ReportCardData[]): Promise<Buffer | null> => {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch(launchOptions);
    try {
      const page = await browser.newPage();
      const html = buildBulkReportCardHtml(dataList);
      
      await page.setContent(html, { waitUntil: "load" });
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
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", (err as Error).message);
    return null;
  }
};

