/**
 * CLI Entry Point
 *
 * Command line interface for @deessejs/collections
 * Supports: init, push, generate
 */

import { initCommand, AVAILABLE_TEMPLATES, type InitOptions } from './cli/commands/init'
import { push } from './cli/commands/push'
import { generate } from './cli/commands/generate'
import { generateTypes } from './cli/commands/generate-types'
import { isErr } from '@deessejs/core'

// ============================================================================
// Types
// ============================================================================

interface ParsedArgs {
  command: 'init' | 'push' | 'generate' | 'generate:types'
  options: Record<string, unknown>
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

const parseArgs = (args: string[]): ParsedArgs => {
  const command = (args[0] ?? 'help') as ParsedArgs['command']
  const options: Record<string, unknown> = {}

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--template' || arg === '-t') {
      const templateValue = args[i + 1]
      if (templateValue && !templateValue.startsWith('-')) {
        if (templateValue === 'minimal' || templateValue === 'todo' || templateValue === 'blog') {
          options.template = templateValue
        } else {
          console.error(`Invalid template: ${templateValue}`)
          console.error(`Available templates: ${AVAILABLE_TEMPLATES.map((t) => t.name).join(', ')}`)
          process.exit(1)
        }
        i++
      } else {
        console.error('--template requires a value (minimal, todo, blog)')
        process.exit(1)
      }
    } else if (arg === '--out' || arg === '-o') {
      const outValue = args[i + 1]
      if (outValue && !outValue.startsWith('-')) {
        options.out = outValue
        i++
      } else {
        console.error('--out requires a value (directory path)')
        process.exit(1)
      }
    } else if (arg === '--config' || arg === '-c') {
      const configValue = args[i + 1]
      if (configValue && !configValue.startsWith('-')) {
        options.config = configValue
        i++
      } else {
        console.error('--config requires a value (file path)')
        process.exit(1)
      }
    } else if (arg === '--name' || arg === '-n') {
      const nameValue = args[i + 1]
      if (nameValue && !nameValue.startsWith('-')) {
        options.name = nameValue
        i++
      } else {
        console.error('--name requires a value (migration name)')
        process.exit(1)
      }
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }

  return { command, options }
}

// ============================================================================
// Help Text
// ============================================================================

const printHelp = (): void => {
  console.log(`
@deessejs/collections CLI

Usage:
  collections <command> [options]

Commands:
  init         Initialize a new project
  push         Push schema changes to database
  generate     Generate migrations
  generate:types Generate TypeScript interfaces

Init Options:
  --template <name>, -t <name>    Template to use (default: minimal)
  --out <dir>, -o <dir>            Output directory (default: ./my-project)

Push Options:
  --config <path>, -c <path>       Config file path (default: ./collection.config.ts)
  --force                           Accept data loss warnings
  --verbose                         Show detailed output

Generate Options:
  --config <path>, -c <path>    Config file path (default: ./collection.config.ts)
  --name <name>, -n <name>      Migration name (optional)
  --out <dir>, -o <dir>         Output directory (default: ./drizzle)
  --verbose                     Show detailed output

Generate:types Options:
  --config <path>, -c <path>    Config file path (default: ./collection.config.ts)
  --output <path>, -o <path>   Output file path (default: ./src/collections-types.ts)
  --verbose                     Show detailed output

Available Templates:
${AVAILABLE_TEMPLATES.map((t) => `  ${t.name.padEnd(12)} ${t.description}`).join('\n')}

Examples:
  collections init
  collections init --template todo
  collections init --template blog --out ./my-blog-project
  collections push
  collections push --config ./my-config.ts --verbose
  collections push --force
  collections generate
  collections generate --name add_users_table
  collections generate:types
  collections generate:types --config ./my-config.ts --output ./src/types.ts
`)
}

// ============================================================================
// Command Handlers
// ============================================================================

const handleInit = (options: Record<string, unknown>): void => {
  const initOptions: InitOptions = {
    template: (options.template as 'minimal' | 'todo' | 'blog') ?? 'minimal',
    out: (options.out as string) ?? './my-project',
  }

  const result = initCommand(initOptions)

  if (isErr(result)) {
    console.error(`Error: ${result.error.message}`)
    if (result.error.args?.reason === 'directory_exists') {
      console.error('Please specify a different directory with --out or remove the existing directory.')
    }
    process.exit(1)
  }

  console.log(`
Project initialized successfully!

Next steps:
  1. cd ${initOptions.out}
  2. pnpm install (or npm install)
  3. Copy .env.example to .env and set DATABASE_URL
  4. pnpm db:generate (using drizzle-kit)
  5. pnpm collections push
`)
}

const handlePush = async (options: Record<string, unknown>): Promise<void> => {
  const pushOptions = {
    config: options.config as string | undefined,
    verbose: options.verbose as boolean | undefined,
    force: options.force as boolean | undefined,
  }

  const result = await push(pushOptions)

  if (isErr(result)) {
    console.error(`Error: ${result.error.message}`)
    process.exit(1)
  }
}

const handleGenerate = async (options: Record<string, unknown>): Promise<void> => {
  const generateOptions = {
    config: options.config as string | undefined,
    verbose: options.verbose as boolean | undefined,
    name: options.name as string | undefined,
    out: options.out as string | undefined,
  }

  const result = await generate(generateOptions)

  if (isErr(result)) {
    console.error(`Error: ${result.error.message}`)
    process.exit(1)
  }
}

const handleGenerateTypes = async (options: Record<string, unknown>): Promise<void> => {
  const generateTypesOptions = {
    configPath: options.config as string | undefined,
    outputPath: options.output as string | undefined,
    verbose: options.verbose as boolean | undefined,
  }

  const result = await generateTypes(generateTypesOptions)

  if (isErr(result)) {
    console.error(`Error: ${result.error.message}`)
    process.exit(1)
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)

  // Handle --help before parsing to avoid issues with unknown flags
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp()
    process.exit(0)
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('@deessejs/collections version 0.2.1')
    process.exit(0)
  }

  const { command, options } = parseArgs(args)

  // Handle help for specific commands
  if (options.help === true) {
    if (command === 'init') {
      console.log(`
collections init

Initialize a new collections project.

Usage: collections init [--template <template>] [--out <directory>]

Options:
  --template <template>    Template to use: minimal, todo, blog (default: minimal)
  --out <directory>       Output directory (default: ./my-project)
`)
      process.exit(0)
    } else if (command === 'push') {
      console.log(`
collections push

Push schema changes to the database.

Usage: collections push [--config <path>] [--force] [--verbose]

Options:
  --config <path>    Path to config file (default: ./collection.config.ts)
  --force            Accept data loss warnings
  --verbose          Show detailed output
`)
      process.exit(0)
    } else if (command === 'generate') {
      console.log(`
collections generate

Generate migrations from schema changes.

Usage: collections generate [--config <path>] [--name <name>] [--out <directory>]

Options:
  --config <path>    Path to config file (default: ./collection.config.ts)
  --name <name>      Migration name (optional)
  --out <directory>  Output directory (default: ./drizzle)
  --verbose          Show detailed output
`)
      process.exit(0)
    } else if (command === 'generate:types') {
      console.log(`
collections generate:types

Generate TypeScript interfaces from collection config.

Usage: collections generate:types [--config <path>] [--output <path>]

Options:
  --config <path>    Path to config file (default: ./collection.config.ts)
  --output <path>    Output file path (default: ./src/collections-types.ts)
  --verbose           Show detailed output
`)
      process.exit(0)
    } else {
      printHelp()
      process.exit(0)
    }
  }

  switch (command) {
    case 'init':
      handleInit(options)
      break
    case 'push':
      await handlePush(options)
      break
    case 'generate':
      await handleGenerate(options)
      break
    case 'generate:types':
      await handleGenerateTypes(options)
      break
    default:
      console.error(`Unknown command: ${command}`)
      printHelp()
      process.exit(1)
  }
}

main()
