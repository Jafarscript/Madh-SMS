import { buildSingleReportCardHtml, buildBulkReportCardHtml, ReportCardData } from "./reportCardTemplate";

const launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process", "--no-zygote"],
};

let cachedBrowser: any = null;

const getBrowser = async () => {
  if (process.env.VERCEL && !process.env.PUPPETEER_EXECUTABLE_PATH) {
    throw new Error("Puppeteer disabled in serverless runtime without PUPPETEER_EXECUTABLE_PATH");
  }
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }
  const puppeteerPkg = "puppeteer";
  const puppeteer = await import(/* @vite-ignore */ puppeteerPkg);
  cachedBrowser = await puppeteer.default.launch(launchOptions);
  cachedBrowser.on("disconnected", () => {
    cachedBrowser = null;
  });
  return cachedBrowser;
};

export const generateSingleReportCardPdf = async (data: ReportCardData): Promise<Buffer | null> => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
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
      await page.close();
    }
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", (err as Error).message);
    return null;
  }
};

export const generateBulkReportCardPdf = async (dataList: ReportCardData[]): Promise<Buffer | null> => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
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
      await page.close();
    }
  } catch (err) {
    console.warn("Puppeteer PDF generation not available in current environment, falling back to HTML print rendering:", (err as Error).message);
    return null;
  }
};

