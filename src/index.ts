#!/usr/bin/env node

import * as https from "node:https";
import * as dns from "node:dns";

// ── ANSI Colors ──
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const BANNER = `
${c.magenta}${c.bold}  ╔═══════════════════════════════════╗
  ║         ai-name v1.0.0            ║
  ║   Creative name generator         ║
  ╚═══════════════════════════════════╝${c.reset}
`;

const HELP = `
${BANNER}
${c.bold}USAGE${c.reset}
  ${c.green}npx @lxgicstudios/ai-name${c.reset} <description> [options]

${c.bold}DESCRIPTION${c.reset}
  Generates creative package/project names from your description.
  Checks npm availability via the registry API and domain
  availability via DNS lookup. Shows 10-20 suggestions with
  availability status.

${c.bold}OPTIONS${c.reset}
  ${c.yellow}--style <mode>${c.reset}      Naming style: ${c.cyan}techy${c.reset} | ${c.cyan}minimal${c.reset} | ${c.cyan}fun${c.reset} (default: techy)
  ${c.yellow}--count <n>${c.reset}         Number of suggestions (default: 15)
  ${c.yellow}--scope <scope>${c.reset}     Check with npm scope (e.g., @myorg)
  ${c.yellow}--tld <tld>${c.reset}         Domain TLD to check (default: .com)
  ${c.yellow}--json${c.reset}              Output results as JSON
  ${c.yellow}--help${c.reset}              Show this help message

${c.bold}STYLES${c.reset}
  ${c.cyan}techy${c.reset}     Tech-forward names (suffixes: -js, -io, -x, etc.)
  ${c.cyan}minimal${c.reset}   Clean, short names (2-3 syllable words)
  ${c.cyan}fun${c.reset}       Playful, creative names (animals, food, colors)

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# Generate names for a task runner${c.reset}
  ${c.green}npx @lxgicstudios/ai-name "fast task runner for node"${c.reset}

  ${c.dim}# Fun style with 20 suggestions${c.reset}
  ${c.green}npx @lxgicstudios/ai-name "image optimizer" --style fun --count 20${c.reset}

  ${c.dim}# Check scoped name availability${c.reset}
  ${c.green}npx @lxgicstudios/ai-name "database orm" --scope @myorg${c.reset}

  ${c.dim}# JSON output${c.reset}
  ${c.green}npx @lxgicstudios/ai-name "cli framework" --json${c.reset}
`;

// ── Types ──
interface Args {
  description: string;
  style: "techy" | "minimal" | "fun";
  count: number;
  scope?: string;
  tld: string;
  json: boolean;
  help: boolean;
}

interface NameSuggestion {
  name: string;
  npmAvailable: boolean;
  domainAvailable: boolean;
  domain: string;
  style: string;
}

// ── Arg Parsing ──
function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    description: "",
    style: "techy",
    count: 15,
    tld: "com",
    json: false,
    help: false,
  };

  const descParts: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--json":
        args.json = true;
        break;
      case "--style":
        {
          const val = argv[++i];
          if (val === "techy" || val === "minimal" || val === "fun") args.style = val;
        }
        break;
      case "--count":
        args.count = Math.min(30, Math.max(5, parseInt(argv[++i], 10) || 15));
        break;
      case "--scope":
        args.scope = argv[++i];
        break;
      case "--tld":
        args.tld = (argv[++i] || "com").replace(/^\./, "");
        break;
      default:
        if (!argv[i].startsWith("--")) {
          descParts.push(argv[i]);
        }
        break;
    }
  }

  args.description = descParts.join(" ");
  return args;
}

// ── Word Lists ──
const techPrefixes = [
  "hyper", "ultra", "turbo", "nano", "micro", "meta", "neo",
  "flux", "core", "sync", "fast", "quick", "blitz", "volt",
  "pulse", "prime", "apex", "zero", "node", "byte",
];

const techSuffixes = [
  "js", "io", "x", "ly", "ify", "kit", "hub", "lab",
  "ops", "run", "go", "cli", "dev", "box", "flow",
  "ware", "stack", "forge", "craft", "work",
];

const minimalWords = [
  "oak", "elm", "ash", "ivy", "bay", "ray", "arc",
  "orb", "gem", "zen", "dew", "hue", "lux", "pix",
  "vox", "dot", "pin", "tap", "rig", "fin",
  "cue", "glow", "ink", "jet", "kit", "nix",
  "axe", "fox", "hex", "ion",
];

const funPrefixes = [
  "happy", "lazy", "dizzy", "fuzzy", "snappy", "zippy",
  "bouncy", "crispy", "groovy", "funky", "cosmic", "stellar",
  "atomic", "electric", "magic", "turbo", "rocket", "ninja",
  "pixel", "quantum",
];

const funNouns = [
  "panda", "otter", "falcon", "phoenix", "dragon", "whale",
  "tiger", "eagle", "wolf", "fox", "shark", "raven",
  "cobra", "hawk", "bear", "lynx", "owl", "crane",
  "mantis", "viper",
];

const actionWords = [
  "build", "launch", "deploy", "ship", "forge", "craft",
  "spark", "bolt", "dash", "rush", "blast", "surge",
  "boost", "lift", "push", "pull", "spin", "flip",
  "snap", "grab",
];

const conceptWords = [
  "cloud", "wave", "storm", "fire", "ice", "wind",
  "star", "moon", "sun", "sky", "sea", "lake",
  "peak", "ridge", "vale", "mesa", "cove", "glen",
  "reef", "dune",
];

// ── Name Generation ──
function extractKeywords(description: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "is", "it", "to", "for", "of", "and", "or",
    "in", "on", "at", "by", "with", "from", "that", "this", "but",
    "not", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "can", "very", "just", "about", "up", "out", "so",
  ]);

  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateNames(description: string, style: string, count: number): string[] {
  const keywords = extractKeywords(description);
  const names = new Set<string>();

  // Helper to add combos
  function addName(name: string) {
    const cleaned = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleaned.length >= 3 && cleaned.length <= 24) {
      names.add(cleaned);
    }
  }

  // Keyword-based combinations
  for (const kw of keywords) {
    if (style === "techy") {
      for (const suffix of shuffle(techSuffixes).slice(0, 4)) {
        addName(`${kw}-${suffix}`);
        addName(`${kw}${suffix}`);
      }
      for (const prefix of shuffle(techPrefixes).slice(0, 3)) {
        addName(`${prefix}-${kw}`);
        addName(`${prefix}${kw}`);
      }
    } else if (style === "minimal") {
      for (const word of shuffle(minimalWords).slice(0, 4)) {
        addName(`${kw}-${word}`);
        addName(`${word}-${kw}`);
      }
      // Truncated/abbreviated keywords
      if (kw.length > 4) {
        addName(kw.slice(0, 4));
        addName(kw.slice(0, 3));
      }
    } else {
      // Fun style
      for (const noun of shuffle(funNouns).slice(0, 3)) {
        addName(`${kw}-${noun}`);
        addName(`${noun}-${kw}`);
      }
      for (const prefix of shuffle(funPrefixes).slice(0, 3)) {
        addName(`${prefix}-${kw}`);
      }
    }
  }

  // Cross-keyword combos
  if (keywords.length >= 2) {
    for (let i = 0; i < keywords.length - 1; i++) {
      addName(`${keywords[i]}-${keywords[i + 1]}`);
      addName(`${keywords[i]}${keywords[i + 1]}`);
    }
  }

  // Style-specific extras
  if (style === "techy") {
    for (const action of shuffle(actionWords).slice(0, 5)) {
      if (keywords[0]) {
        addName(`${action}-${keywords[0]}`);
        addName(`${keywords[0]}-${action}`);
      }
    }
  } else if (style === "fun") {
    for (const prefix of shuffle(funPrefixes).slice(0, 5)) {
      for (const noun of shuffle(funNouns).slice(0, 3)) {
        addName(`${prefix}-${noun}`);
      }
    }
  } else {
    for (const concept of shuffle(conceptWords).slice(0, 5)) {
      addName(concept);
      if (keywords[0]) addName(`${concept}-${keywords[0]}`);
    }
  }

  // Pure concept combinations
  for (const concept of shuffle(conceptWords).slice(0, 3)) {
    for (const action of shuffle(actionWords).slice(0, 3)) {
      addName(`${action}-${concept}`);
    }
  }

  return shuffle([...names]).slice(0, count);
}

// ── Availability Checks ──
function checkNpmAvailability(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    https
      .get(url, { headers: { "User-Agent": "ai-name-cli/1.0.0" } }, (res) => {
        // 404 means available
        resolve(res.statusCode === 404);
        res.resume();
      })
      .on("error", () => resolve(true)); // Assume available on error
  });
}

function checkDomainAvailability(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolve(domain, (err) => {
      // If DNS resolution fails, domain might be available
      resolve(!!err);
    });
  });
}

// ── Progress ──
function showProgress(current: number, total: number) {
  const bar = "█".repeat(Math.floor((current / total) * 25)) + "░".repeat(25 - Math.floor((current / total) * 25));
  process.stdout.write(`\r  ${c.cyan}[${bar}]${c.reset} ${current}/${total} checked`);
}

// ── Main ──
async function main() {
  const args = parseArgs();

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (!args.description) {
    console.log(HELP);
    console.error(`${c.red}${c.bold}Error:${c.reset} Please provide a description.`);
    console.error(`${c.dim}Example: npx @lxgicstudios/ai-name "fast web server"${c.reset}\n`);
    process.exit(1);
  }

  if (!args.json) {
    console.log(BANNER);
    console.log(`${c.bold}Description:${c.reset} ${c.cyan}"${args.description}"${c.reset}`);
    console.log(`${c.bold}Style:${c.reset}       ${c.yellow}${args.style}${c.reset}`);
    console.log(`${c.bold}Count:${c.reset}       ${args.count} suggestions`);
    if (args.scope) console.log(`${c.bold}Scope:${c.reset}       ${c.magenta}${args.scope}${c.reset}`);
    console.log("");
    console.log(`${c.dim}Generating names and checking availability...${c.reset}\n`);
  }

  const names = generateNames(args.description, args.style, args.count);
  const results: NameSuggestion[] = [];

  // Check availability in batches
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const npmName = args.scope ? `${args.scope}/${name}` : name;
    const domain = `${name.replace(/-/g, "")}.${args.tld}`;

    const [npmAvail, domainAvail] = await Promise.all([
      checkNpmAvailability(npmName),
      checkDomainAvailability(domain),
    ]);

    results.push({
      name: npmName,
      npmAvailable: npmAvail,
      domainAvailable: domainAvail,
      domain,
      style: args.style,
    });

    if (!args.json) showProgress(i + 1, names.length);
  }

  if (!args.json) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }

  // JSON output
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          description: args.description,
          style: args.style,
          suggestions: results,
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  // Pretty output
  const nameWidth = Math.max(25, ...results.map((r) => r.name.length + 2));
  const domainWidth = Math.max(20, ...results.map((r) => r.domain.length + 2));

  console.log(
    `  ${c.bold}${"Name".padEnd(nameWidth)}${"npm".padEnd(10)}${"Domain".padEnd(domainWidth)}${"DNS"}${c.reset}`
  );
  console.log(`  ${c.dim}${"─".repeat(nameWidth + domainWidth + 18)}${c.reset}`);

  for (const suggestion of results) {
    const npmIcon = suggestion.npmAvailable
      ? `${c.green}● free${c.reset}`
      : `${c.red}✖ taken${c.reset}`;
    const domainIcon = suggestion.domainAvailable
      ? `${c.green}● free${c.reset}`
      : `${c.red}✖ taken${c.reset}`;

    const allAvail = suggestion.npmAvailable && suggestion.domainAvailable;
    const nameColor = allAvail ? c.green + c.bold : suggestion.npmAvailable ? c.yellow : c.dim;

    console.log(
      `  ${nameColor}${suggestion.name.padEnd(nameWidth)}${c.reset}` +
      `${npmIcon.padEnd(10 + 9)}` + // +9 for ANSI codes
      `${suggestion.domain.padEnd(domainWidth)}` +
      `${domainIcon}`
    );
  }

  // Summary
  const npmFree = results.filter((r) => r.npmAvailable).length;
  const domainFree = results.filter((r) => r.domainAvailable).length;
  const bothFree = results.filter((r) => r.npmAvailable && r.domainAvailable).length;

  console.log(`\n  ${c.dim}${"─".repeat(nameWidth + domainWidth + 18)}${c.reset}`);
  console.log(`\n${c.bold}Summary${c.reset}`);
  console.log(`  npm available:    ${c.green}${npmFree}${c.reset}/${results.length}`);
  console.log(`  Domain available: ${c.green}${domainFree}${c.reset}/${results.length}`);
  console.log(`  Both available:   ${c.green}${c.bold}${bothFree}${c.reset}/${results.length}`);

  if (bothFree > 0) {
    console.log(`\n  ${c.green}${c.bold}Top picks (npm + domain available):${c.reset}`);
    for (const r of results.filter((r) => r.npmAvailable && r.domainAvailable).slice(0, 5)) {
      console.log(`    ${c.green}★${c.reset} ${c.bold}${r.name}${c.reset} ${c.dim}(${r.domain})${c.reset}`);
    }
  }

  console.log("");
}

main().catch((err) => {
  console.error(`${c.red}${c.bold}Error:${c.reset} ${err.message}`);
  process.exit(1);
});
