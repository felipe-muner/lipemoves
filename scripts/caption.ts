/**
 * Pick an Instagram caption from captions/{movement,protocol}.md and print it
 * to stdout (also copy to clipboard on macOS).
 *
 * Usage:
 *   pnpm caption                  # random pattern, random number
 *   pnpm caption movement         # random movement
 *   pnpm caption protocol         # random protocol
 *   pnpm caption movement 3       # movement #3
 *   pnpm caption protocol 7       # protocol #7
 *   pnpm caption --list           # show all titles
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Pattern = "movement" | "protocol";

interface Entry {
  pattern: Pattern;
  number: number;
  title: string;
  body: string;
}

function parseFile(pattern: Pattern): Entry[] {
  const text = readFileSync(resolve(`captions/${pattern}.md`), "utf8");
  const entries: Entry[] = [];
  // Each entry starts with `## N — Title` and runs until the next `## ` or EOF.
  const re = /^## (\d+) — (.+?)$([\s\S]*?)(?=^## |$(?![\r\n]))/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    entries.push({
      pattern,
      number: Number(m[1]),
      title: m[2].trim(),
      body: m[3].trim(),
    });
  }
  return entries;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function copyToClipboard(text: string): boolean {
  try {
    execSync("pbcopy", { input: text });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    for (const p of ["movement", "protocol"] as Pattern[]) {
      console.log(`\n[${p}]`);
      for (const e of parseFile(p)) {
        console.log(`  ${e.number}. ${e.title}`);
      }
    }
    return;
  }

  const pattern = (args[0] as Pattern) ?? pickRandom(["movement", "protocol"]);
  if (pattern !== "movement" && pattern !== "protocol") {
    console.error(`Unknown pattern: ${pattern}. Use "movement" or "protocol".`);
    process.exit(1);
  }

  const entries = parseFile(pattern);
  const requestedNumber = args[1] ? Number(args[1]) : null;
  const entry = requestedNumber
    ? entries.find((e) => e.number === requestedNumber)
    : pickRandom(entries);

  if (!entry) {
    console.error(`No caption #${requestedNumber} in ${pattern}`);
    process.exit(1);
  }

  console.log(`\n━━━ ${entry.pattern} #${entry.number} — ${entry.title} ━━━\n`);
  console.log(entry.body);
  console.log();

  if (copyToClipboard(entry.body)) {
    console.log("✓ copied to clipboard");
  }
}

main();
