const express = require("express");
const puppeteer = require("puppeteer-core");
const puppeteerBase = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const os = require("os");

// Detectar sistema operativo
const platform = os.platform(); // 'darwin' (Mac), 'win32' (Windows), 'linux' (Linux)
console.log(`[INFO] Running on platform: ${platform}`);

const EXECUTABLE_PATHS = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // Mac
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
  linux: "/usr/bin/google-chrome-stable", // Linux (Cloud Run, Docker, etc.)
};
const app = express();
const PORT = process.env.PORT || 8080;


const getExecutablePath = () => {
  const path =
    process.env.PUPPETEER_EXECUTABLE_PATH || EXECUTABLE_PATHS[platform];
  if (!path) {
    throw new Error("[ERROR] No suitable Chrome executable found!");
  }
  console.log(`[INFO] Using Chrome path: ${path}`);
  return path;
};

app.get("/", (req, res) => {
  res.send("Puppeteer API is running...");
  console.log("[INFO] Puppeteer API is running...");
});

app.get("/scrape", async (req, res) => {
  try {
    console.log("[INFO] Launching Puppeteer...");
    const browser = await puppeteer.launch({
      executablePath: getExecutablePath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    console.log("[INFO] New browser instance created...");
    const page = await browser.newPage();

    // Simula un navegador real para evitar bloqueos
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("[INFO] Opening page...");
    await page.goto(
      "http://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php",
      {
        waitUntil: "networkidle2", // Asegura que la página está completamente cargada
        timeout: 30000, // Espera hasta 30 segundos
      }
    );

    console.log("[INFO] Page loaded successfully...");

    // Verifica si el contenido es HTML antes de acceder a `document.body`
    const isHtml = await page.evaluate(() => {
      return document.contentType === "text/html";
    });

    if (!isHtml) {
      throw new Error("[ERROR] The page is not returning HTML content!");
    }

    console.log("[INFO] Extracting page content...");
    const bodyContent = await page.evaluate(() => {
      if (!document || !document.body) {
        console.error("[ERROR] document.body is not accessible!");
        return null;
      }
      return document.body.textContent;
    });

    if (!bodyContent) {
      throw new Error("[ERROR] No content extracted from page!");
    }

    console.log(
      `[INFO] Extracted content: ${bodyContent.substring(0, 500)}...`
    );

    await browser.close();
    console.log("[INFO] Browser closed...");

    try {
      console.log("[INFO] Parsing JSON response...");
      const jsonData = JSON.parse(bodyContent);
      res
        .status(200)
        .json({ message: "Data scraped successfully", data: jsonData });
    } catch (error) {
      console.error("[ERROR] Failed to parse scraped data as JSON.");
      throw new Error("Failed to parse scraped data as JSON.");
    }
  } catch (error) {
    console.error("[ERROR] Error while scraping:", error);
    res.status(500).json({
      message: "Error while scraping the page.",
      error: error.message,
    });
  }
});

app.get("/test-scrape", async (req, res) => {
  try {
    puppeteerBase.use(StealthPlugin());
    console.log("[INFO] Launching Puppeteer...");
    const browser = await puppeteerBase.launch({
      executablePath: getExecutablePath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    console.log("[INFO] New browser instance created...");
    const page = await browser.newPage();

    // Simula un navegador real para evitar bloqueos
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("[INFO] Opening page...");
    await page.goto(
      "http://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php",
      {
        waitUntil: "networkidle2", // Asegura que la página está completamente cargada
        timeout: 30000, // Espera hasta 30 segundos
      }
    );

    console.log("[INFO] Page loaded successfully...");

    // Verifica si el contenido es HTML antes de acceder a `document.body`
    const isHtml = await page.evaluate(() => {
      return document.contentType === "text/html";
    });

    if (!isHtml) {
      throw new Error("[ERROR] The page is not returning HTML content!");
    }

    console.log("[INFO] Extracting page content...");
    const bodyContent = await page.evaluate(() => {
      if (!document || !document.body) {
        console.error("[ERROR] document.body is not accessible!");
        return null;
      }
      return document.body.textContent;
    });

    if (!bodyContent) {
      throw new Error("[ERROR] No content extracted from page!");
    }

    console.log(
      `[INFO] Extracted content: ${bodyContent.substring(0, 500)}...`
    );

    await browser.close();
    console.log("[INFO] Browser closed...");

    try {
      console.log("[INFO] Parsing JSON response...");
      const jsonData = JSON.parse(bodyContent);
      res
        .status(200)
        .json({ message: "Data scraped successfully", data: jsonData });
    } catch (error) {
      console.error("[ERROR] Failed to parse scraped data as JSON.");
      throw new Error("Failed to parse scraped data as JSON.");
    }
  } catch (error) {
    console.error("[ERROR] Error while scraping:", error);
    res.status(500).json({
      message: "Error while scraping the page.",
      error: error.message,
    });
  }
});
app.listen(PORT, () => {
  console.log(`[INFO] Server is running on port ${PORT}`);
});
