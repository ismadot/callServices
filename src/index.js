const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Puppeteer API is running...");
  console.log(`Puppeteer API is running...`);
});

// Verifica qué navegador está disponible
const EXECUTABLE_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
];

const getExecutablePath = () => {
  for (const path of EXECUTABLE_PATHS) {
    if (path) {
      console.log(`Trying Puppeteer with: ${path}`);
      return path;
    }
  }
  throw new Error("No suitable browser found!");
};

app.get("/scrape", async (req, res) => {
  try {
    console.log("Launching Puppeteer...");
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
        "--single-process", // Especialmente útil en entornos limitados
      ],
    });

    const page = await browser.newPage();
    await page.goto(
      "http://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php",
      {
        waitUntil: "domcontentloaded",
      }
    );

    console.log("Extracting page content...", document.body);

    // Extraer contenido dentro del contexto del navegador
    const bodyContent = await page.evaluate(() => {
      console.log("Inside browser context:", document.body.textContent);
      return document.body.textContent;
    });
    await browser.close();

    try {
      const jsonData = JSON.parse(bodyContent);
      res
        .status(200)
        .json({ message: "Data scraped successfully", data: jsonData });
    } catch (error) {
      throw new Error("Failed to parse scraped data as JSON.");
    }
  } catch (error) {
    console.error("Error while scraping:", error.message);
    res.status(500).json({
      message: "Error while scraping the page.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
