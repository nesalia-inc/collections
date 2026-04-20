/**
 * Generate Types Command
 *
 * Generates TypeScript interfaces from collection config.
 *
 * Flow:
 * 1. Load collection.config.ts dynamically
 * 2. For each collection, generate a TypeScript interface
 * 3. Write the interfaces to the output file
 */

import { ok, err, error, attempt, type Result } from '@deessejs/core'
import { z } from 'zod'
import { writeFile } from 'node:fs/promises'
import { loadConfig, type LoadedConfig } from '../utils/loadConfig'
import type { Collection } from '../../collections/types'
import type { Field } from '../../fields/types'

// ============================================================================
// Error Types
// ============================================================================

const ConfigLoadError = error({
  name: 'ConfigLoadError',
  schema: z.object({
    path: z.string(),
    cause: z.string(),
  }),
  message: (args) => `Failed to load config from ${args.path}: ${args.cause}`,
})

const WriteFileError = error({
  name: 'WriteFileError',
  schema: z.object({
    path: z.string(),
    cause: z.string(),
  }),
  message: (args) => `Failed to write file ${args.path}: ${args.cause}`,
})

export type GenerateTypesErrorType = ReturnType<
  typeof ConfigLoadError | typeof WriteFileError
>

// ============================================================================
// Type Helpers
// ============================================================================

const toPascalCase = (str: string): string =>
  str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

/**
 * Unwrap ZodOptional and ZodDefault to get the inner Zod schema
 */
const unwrapZodSchema = (schema: z.ZodType<unknown>): z.ZodType<unknown> => {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
    return unwrapZodSchema(schema._def.innerType as z.ZodType<unknown>)
  }
  return schema
}

const fieldToTS = (field: Field<unknown>): string => {
  const schema = field.fieldType.schema
  const unwrapped = unwrapZodSchema(schema)

  if (unwrapped instanceof z.ZodString) return 'string'
  if (unwrapped instanceof z.ZodBoolean) return 'boolean'
  if (unwrapped instanceof z.ZodNumber) return 'number'
  if (unwrapped instanceof z.ZodDate) return 'Date'
  if (unwrapped instanceof z.ZodEnum) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = (unwrapped as z.ZodEnum<readonly [string, ...string[]]>).options
    return values.map(v => `'${v}'`).join(' | ')
  }
  if (unwrapped instanceof z.ZodArray) return 'unknown[]'
  if (unwrapped instanceof z.ZodObject) return 'Record<string, unknown>'

  return 'unknown'
}

const isFieldRequired = (field: Field<unknown>): boolean => {
  if (field.required) return true
  if (field.defaultValue !== undefined) return true
  return false
}

const generateInterface = (collection: Collection): string => {
  const lines: string[] = []
  const interfaceName = toPascalCase(collection.slug) + 'Record'

  lines.push(`export interface ${interfaceName} {`)

  // Auto-generated fields
  lines.push('  id: number')
  lines.push('  createdAt: Date')
  lines.push('  updatedAt: Date')

  // User fields
  for (const [name, field] of Object.entries(collection.fields)) {
    if (['id', 'createdAt', 'updatedAt'].includes(name)) continue
    const tsType = fieldToTS(field)
    const required = isFieldRequired(field)
    const optional = required ? '' : '?'
    lines.push(`  ${name}${optional}: ${tsType}`)
  }

  lines.push('}')

  return lines.join('\n')
}

// ============================================================================
// Generate Types Command
// ============================================================================

export interface GenerateTypesOptions {
  /** Path to config file */
  readonly configPath?: string
  /** Output file path */
  readonly outputPath?: string
  /** Enable verbose output */
  readonly verbose?: boolean
}

/**
 * Generate TypeScript interfaces from collection config
 */
export const generateTypes = async (
  options: GenerateTypesOptions
): Promise<Result<Unit, GenerateTypesErrorType>> => {
  const configPath = options.configPath ?? './collection.config.ts'
  const outputPath = options.outputPath ?? './src/collections-types.ts'
  const verbose = options.verbose ?? false

  if (verbose) {
    console.log('[verbose] Loading config from:', configPath)
  }

  // Step 1: Load config
  const configResult = await loadConfig(configPath)
  if (!configResult.ok) {
    return err(ConfigLoadError({ path: configPath, cause: String(configResult.error) }))
  }

  const config: LoadedConfig = configResult.value
  const collections = Object.values(config.collections) as Collection[]

  if (verbose) {
    console.log('[verbose] Loaded', collections.length, 'collections')
  }

  // Step 2: Generate interfaces
  if (verbose) {
    console.log('[verbose] Generating TypeScript interfaces...')
  }

  const interfaceLines: string[] = [
    '/**',
    ' * Auto-generated TypeScript interfaces from collection config',
    ' *',
    ' * NOTE: This file is auto-generated. Do not edit manually.',
    ' * Run "collections generate:types" to regenerate.',
    ' */',
    '',
  ]

  for (const collection of collections) {
    interfaceLines.push(generateInterface(collection))
    interfaceLines.push('')
  }

  const outputContent = interfaceLines.join('\n')

  if (verbose) {
    console.log('[verbose] Generated', collections.length, 'interfaces')
  }

  // Step 3: Write output file
  if (verbose) {
    console.log('[verbose] Writing to:', outputPath)
  }

  const writeResult = await attempt(async () => {
    await writeFile(outputPath, outputContent, 'utf-8')
  })

  if (!writeResult.ok) {
    return err(WriteFileError({ path: outputPath, cause: String(writeResult.error) }))
  }

  console.log('\n=== Types Generated ===\n')
  console.log(`Output: ${outputPath}`)
  console.log(`Interfaces: ${collections.length}`)

  return ok({})
}

// Unit type for void returns
type Unit = Record<never, never>
