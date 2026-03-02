const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

const replacements = [
  { from: "text-white", to: "text-zinc-900 dark:text-white" },
  { from: "bg-zinc-950", to: "bg-white dark:bg-zinc-950" },
  { from: "bg-zinc-900", to: "bg-zinc-50 dark:bg-zinc-900" },
  { from: "bg-zinc-800", to: "bg-zinc-100 dark:bg-zinc-800" },
  { from: "bg-zinc-700", to: "bg-zinc-200 dark:bg-zinc-700" },
  { from: "border-zinc-800", to: "border-zinc-200 dark:border-zinc-800" },
  { from: "text-zinc-400", to: "text-zinc-600 dark:text-zinc-400" },
  { from: "text-zinc-300", to: "text-zinc-700 dark:text-zinc-300" },
  { from: "text-zinc-200", to: "text-zinc-800 dark:text-zinc-200" },
  { from: "bg-black/50", to: "bg-black/20 dark:bg-black/50" },
  { from: "bg-black/80", to: "bg-black/40 dark:bg-black/80" },
];

function processFile(filePath) {
  if (filePath.includes("theme-toggle.tsx")) return;

  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  replacements.forEach((r) => {
    // Regex ensures we only replace standalone class names, and not those already prefixed with `dark:`
    const regex = new RegExp(
      `(?<=[\\s"'\\\`{]|^|\\b)${r.from.replace("/", "\\/")}(?=[\\s"'\\\`}]|$|\\b)`,
      "g",
    );
    content = content.replace(regex, (match, offset, string) => {
      // Check if preceded by `dark:`
      if (offset >= 5 && string.slice(offset - 5, offset) === "dark:") {
        return match; // Don't replace if it's already a dark: class
      }
      return r.to;
    });
  });

  if (original !== content) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated CSS in: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith(".tsx")) {
      processFile(fullPath);
    }
  }
}

console.log("Starting automated CSS migration...");
walkDir(srcDir);
console.log("Migration complete.");
