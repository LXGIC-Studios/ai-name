# @lxgicstudios/ai-name

[![npm version](https://img.shields.io/npm/v/@lxgicstudios/ai-name)](https://www.npmjs.com/package/@lxgicstudios/ai-name)
[![npm downloads](https://img.shields.io/npm/dm/@lxgicstudios/ai-name)](https://www.npmjs.com/package/@lxgicstudios/ai-name)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

> Generate creative package and project names from a description. Checks npm and domain availability. Zero dependencies.

## Features

- Generates 10-20+ creative name suggestions from your description
- Checks npm registry availability in real-time
- Checks domain availability via DNS lookup
- Three naming styles: techy, minimal, fun
- Scope support for checking `@org/package` names
- Configurable TLD for domain checks (.com, .io, .dev, etc.)
- Highlights names where both npm and domain are free
- JSON output for automation
- Zero external dependencies

## Installation

Run directly with npx:

```bash
npx @lxgicstudios/ai-name "your project description"
```

Or install globally:

```bash
npm install -g @lxgicstudios/ai-name
```

## Usage

```bash
ai-name <description> [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--style <mode>` | Naming style: `techy`, `minimal`, or `fun` | `techy` |
| `--count <n>` | Number of suggestions (5-30) | `15` |
| `--scope <scope>` | npm scope to check (e.g., `@myorg`) | None |
| `--tld <tld>` | Domain TLD to check | `com` |
| `--json` | Output results as JSON | `false` |
| `--help` | Show help message | |

### Naming Styles

| Style | Description | Examples |
|-------|-------------|---------|
| `techy` | Tech-forward with suffixes like -js, -io | `taskflow`, `hyper-run`, `blitz-cli` |
| `minimal` | Clean, short, memorable words | `oak`, `cue`, `ray-task` |
| `fun` | Playful with animals, adjectives | `snappy-falcon`, `cosmic-panda` |

### Examples

```bash
# Generate names for a task runner
npx @lxgicstudios/ai-name "fast task runner for node"

# Fun style with 20 suggestions
npx @lxgicstudios/ai-name "image optimizer" --style fun --count 20

# Check scoped availability
npx @lxgicstudios/ai-name "database orm" --scope @myorg

# Check .io domains instead of .com
npx @lxgicstudios/ai-name "api gateway" --tld io

# JSON output for scripts
npx @lxgicstudios/ai-name "cli framework" --json
```

### Sample Output

```
  Name                     npm       Domain               DNS
  ─────────────────────────────────────────────────────────────
  hyper-task               ● free    hypertask.com        ● free
  taskflow-js              ● free    taskflowjs.com       ✖ taken
  blitz-runner             ● free    blitzrunner.com      ● free
  turbo-exec               ✖ taken   turboexec.com        ● free
  nano-task                ● free    nanotask.com         ✖ taken

Summary
  npm available:    12/15
  Domain available: 8/15
  Both available:   6/15

  Top picks (npm + domain available):
    ★ hyper-task (hypertask.com)
    ★ blitz-runner (blitzrunner.com)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/cool-feature`)
3. Commit your changes (`git commit -m 'feat: add cool feature'`)
4. Push to the branch (`git push origin feature/cool-feature`)
5. Open a Pull Request

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built by **[LXGIC Studios](https://lxgicstudios.com)**

[GitHub](https://github.com/lxgicstudios/ai-name) | [Twitter](https://x.com/lxgicstudios)
