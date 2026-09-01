const fs = require("node:fs/promises");
const path = require("node:path");
const data = require("../data.js");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const client = path.join(output, "client");

async function copy(source, destination) {
  await fs.cp(path.join(root, source), path.join(client, destination), { recursive: true, force: true });
}

async function build() {
  await fs.mkdir(path.join(output, "server"), { recursive: true });
  await fs.mkdir(client, { recursive: true });
  await Promise.all([
    copy("index.html", "index.html"),
    copy("app.js", "app.js"),
    copy("data.js", "data.js"),
    copy("styles.css", "styles.css"),
    copy("assets", "assets"),
    copy("data", "data")
  ]);
  await fs.copyFile(path.join(root, "worker", "site-worker.js"), path.join(output, "server", "index.js"));
  await fs.writeFile(path.join(client, "data", "observatory-data.json"), `${JSON.stringify(data)}\n`, "utf8");
  process.stdout.write("Prepared deployable site output.\n");
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
