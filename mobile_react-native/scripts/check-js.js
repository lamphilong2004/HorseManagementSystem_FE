const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.argv[2] || "src";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && full.endsWith(".js") ? [full] : [];
  });
}

let failed = false;
for (const file of walk(root)) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
