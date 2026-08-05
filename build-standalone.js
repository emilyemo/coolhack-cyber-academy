const fs = require("fs");

const html = fs.readFileSync("service-desk.html", "utf8");
const css = ["service-desk.css", "service-desk-guided.css"]
  .map(file => fs.readFileSync(file, "utf8"))
  .join("\n");
const javascript = fs.readFileSync("service-desk.js", "utf8");
const config = fs.readFileSync("supabase-config.js", "utf8");

const standalone = html
  .replace('<link rel="stylesheet" href="service-desk.css">\n  <link rel="stylesheet" href="service-desk-guided.css">', () => `<style>\n${css}\n  </style>`)
  .replace('<script src="service-desk.js"></script>', () => `<script>window.CoolHackStandaloneDemo = true;</script>\n  <script>\n${javascript}\n  </script>`)
  .replace('<script src="supabase-config.js"></script>', () => `<script>\n${config}\n  </script>`)
  .replaceAll('href="service-desk.html"', 'href="#workspace"');

if (standalone.includes('src="service-desk.js"') || standalone.includes('src="supabase-config.js"') || standalone.includes('href="service-desk.css"')) {
  throw new Error("Standalone build still contains external assets.");
}

fs.writeFileSync("CoolHack-Service-Desk.html", standalone);
