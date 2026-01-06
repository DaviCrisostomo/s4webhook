import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Render persistent disk mount path
const DATA_DIR = "/data";
const LOG_FILE = path.join(DATA_DIR, "webhook.log");

// Ensure directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

app.post("/webhook", (req, res) => {
  const entry = {
    timestamp: new Date().toISOString(),
    payload: req.body
  };

  fs.appendFile(
    LOG_FILE,
    JSON.stringify(entry) + "\n",
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Failed to write file");
      }
      res.status(200).send("OK");
    }
  );
});

app.get("/webhook", (req, res) => {
  fs.readFile(LOG_FILE, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(200).json([]);
      }
      return res.status(500).send("Failed to read file");
    }

    // Each line is one JSON object
    const lines = data
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });

    res.json(lines);
  });
});

app.listen(PORT, () => {
  console.log(`Webhook listening on port ${PORT}`);
});