import http from "http";
import fs from "fs/promises";
import path from "path";

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";
  let filePath = path.join(
    process.cwd(),
    "front",
    url === "/" ? "index.html" : url
  );

  const extname = path.extname(filePath);
  let contentType = "text/html";
  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpg";
      break;
  }

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end("<h1>500 Something went wrong</h1>");
  }
});

export const startApplication = (port: number): http.Server => {
  server.listen(port, () => {
    console.log(`Application served on http://localhost:${port}`);
  });
  return server;
};
