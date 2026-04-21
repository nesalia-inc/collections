/**
 * CLI Command Router
 *
 * Handles command routing for the collections CLI.
 * Supports: push, generate, init
 */

import { ok, err, error, type Result } from '@deessejs/core'
import { z } from 'zod'
import { push } from './commands/push'
import { generate } from './commands/generate'
import { initCommand } from './commands/init'

// ============================================================================
// Error Types
// ============================================================================

const UnknownCommandError = error({
  name: 'UnknownCommand',
  schema: z.object({
    command: z.string(),
  }),
  message: (args) => `Unknown command: ${args.command}. Use: push, generate, or init`,
})

// CliError represents errors that can occur in CLI commands
export type CliError = ReturnType<typeof UnknownCommandError>

// ============================================================================
// Common CLI Options
// ============================================================================

export interface CommonCliOptions {
  /** Path to config file */
  readonly config?: string
  /** Enable verbose output */
  readonly verbose?: boolean
}

// ============================================================================
// Push Options
// ============================================================================

export interface PushOptions extends CommonCliOptions {
  /** Accept data loss warnings */
  readonly force?: boolean
}

// ============================================================================
// Generate Options
// ============================================================================

export interface GenerateOptions extends CommonCliOptions {
  /** Migration name */
  readonly name?: string
  /** Output directory */
  readonly out?: string
}

// ============================================================================
// Init Options
// ============================================================================

export interface InitOptions {
  /** Template to use */
  readonly template?: 'minimal' | 'todo' | 'blog'
  /** Output directory */
  readonly out: string
}

// ============================================================================
// Command Router
// ============================================================================

/**
 * Parse command-line arguments into options
 */
const parseArgs = (args: string[]): { command: string; options: Record<string, unknown> } => {
  const command = args[0] ?? ''
  const options: Record<string, unknown> = {}

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        options[key] = next
        i++
      } else {
        options[key] = true
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1)
      const next = args[i + 1]
      if (next && !next.startsWith('-')) {
        options[key] = next
        i++
      } else {
        options[key] = true
      }
    }
  }

  return { command, options }
}

/**
 * Main CLI entry point
 */
export const runCli = async (args: string[]): Promise<Result<Unit, CliError>> => {
  const { command, options } = parseArgs(args)

  if (!command) {
    console.log(`
@deessejs/collections CLI

Usage: collections <command> [options]

Commands:
  push         Push schema changes to database
  generate     Generate migrations
  init         Initialize a new collections project

Options:
  --config <path>    Path to config file (default: ./collection.config.ts)
  --verbose          Enable verbose output

Run 'collections <command> --help' for more information on a command.
`)
    return ok({})
  }

  switch (command) {
    case 'push': {
      const pushOptions: PushOptions = {
        config: options.config as string | undefined,
        verbose: options.verbose as boolean | undefined,
        force: options.force as boolean | undefined,
      }

      if (options.help === true) {
        console.log(`
collections push

Push schema changes to the database.

Usage: collections push [--config <path>] [--force] [--verbose]

Options:
  --config <path>    Path to config file (default: ./collection.config.ts)
  --force            Accept data loss warnings
  --verbose          Show detailed output
`)
        return ok({})
      }

      return await push(pushOptions) as unknown as Result<Unit, CliError>
    }

    case 'generate': {
      const generateOptions: GenerateOptions = {
        config: options.config as string | undefined,
        verbose: options.verbose as boolean | undefined,
        name: options.name as string | undefined,
        out: options.out as string | undefined,
      }

      if (options.help === true) {
        console.log(`
collections generate

Generate migrations from schema changes.

Usage: collections generate [name] [--config <path>] [--out <directory>]

Options:
  --config <path>    Path to config file (default: ./collection.config.ts)
  --out <directory>   Output directory (default: ./drizzle)
  --verbose          Show detailed output
`)
        return ok({})
      }

      return await generate(generateOptions) as unknown as Result<Unit, CliError>
    }

    case 'init': {
      if (options.help === true) {
        console.log(`
collections init

Initialize a new collections project.

Usage: collections init [--template <template>] [--out <directory>]

Options:
  --template <template>    Template to use: minimal, todo, blog (default: minimal)
  --out <directory>       Output directory (default: ./my-collections-project)
`)
        return ok({})
      }

      const initOptions = {
        template: (options.template as 'minimal' | 'todo' | 'blog') ?? 'minimal',
        out: (options.out as string) ?? './my-collections-project',
      }

      const initResult = initCommand(initOptions)
      if (!initResult.ok) {
        // Map init error to CliError
        const errorMessage = initResult.error.message
        console.error(`Error: ${errorMessage}`)
        return err(UnknownCommandError({ command: `init` })) as unknown as Result<Unit, CliError>
      }
      return ok({})
    }

    default:
      return err(UnknownCommandError({ command }))
  }
}

// Unit type for void returns
type Unit = Record<never, never>
