import fs from "node:fs";
import path from "node:path";

export interface OfflineViolation {
  file: string;
  line: number;
  pattern: string;
  lineContent: string;
}

export const FORBIDDEN_PATTERNS = [
  "DEEPL_API_KEY",
  "api.deepl.com",
  "api-free.deepl.com",
  "api.openai.com",
  "api.anthropic.com",
  "translation.googleapis.com",
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);

export function scanForOfflineViolations(
  dir: string = path.resolve(process.cwd(), "src")
): { violations: OfflineViolation[]; filesScanned: number } {
  const violations: OfflineViolation[] = [];
  let filesScanned = 0;

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (SCAN_EXTENSIONS.has(ext)) {
          filesScanned++;
          const content = fs.readFileSync(fullPath, "utf8");
          const lines = content.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of FORBIDDEN_PATTERNS) {
              if (line.includes(pattern)) {
                violations.push({
                  file: path.relative(process.cwd(), fullPath),
                  line: i + 1,
                  pattern,
                  lineContent: line.trim(),
                });
              }
            }
          }
        }
      }
    }
  }

  walk(dir);
  return { violations, filesScanned };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const targetDir = path.resolve(process.cwd(), "src");
  const { violations, filesScanned } = scanForOfflineViolations(targetDir);

  if (violations.length > 0) {
    console.error(`\n❌ Offline Architectural Violation: Found ${violations.length} forbidden external API reference(s) in src/:`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} -> matches "${v.pattern}"`);
      console.error(`    ${v.lineContent}`);
    }
    process.exit(1);
  } else {
    console.log(`\n✓ Offline Guardrail Passed: 0 external API references found in src/ (${filesScanned} source files scanned).`);
    process.exit(0);
  }
}

