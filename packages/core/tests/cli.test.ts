import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseArgs, printUsage, validatePath } from '../src/cli'
import { pgAdapter } from '../src/adapter'

describe('CLI', () => {
  describe('parseArgs', () => {
    const originalEnv = process.env
    const originalArgv = process.argv
    let exitMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      process.env = { ...originalEnv }
      exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never)
    })

    afterEach(() => {
      process.env = originalEnv
      process.argv = originalArgv
      exitMock.mockRestore()
    })

    it('parses db:push command', () => {
      process.argv = ['node', 'collections', 'db:push']

      const { command, options } = parseArgs()

      expect(command).toBe('db:push')
      expect(options.verbose).toBe(false)
      expect(options.dryRun).toBe(false)
      expect(options.out).toBe('./drizzle')
    })

    it('parses db:generate command', () => {
      process.argv = ['node', 'collections', 'db:generate']

      const { command, options } = parseArgs()

      expect(command).toBe('db:generate')
    })

    it('parses db:migrate command', () => {
      process.argv = ['node', 'collections', 'db:migrate']

      const { command, options } = parseArgs()

      expect(command).toBe('db:migrate')
    })

    it('parses --verbose flag', () => {
      process.argv = ['node', 'collections', 'db:push', '--verbose']

      const { options } = parseArgs()

      expect(options.verbose).toBe(true)
    })

    it('parses -v short flag', () => {
      process.argv = ['node', 'collections', 'db:push', '-v']

      const { options } = parseArgs()

      expect(options.verbose).toBe(true)
    })

    it('parses --dry-run flag', () => {
      process.argv = ['node', 'collections', 'db:push', '--dry-run']

      const { options } = parseArgs()

      expect(options.dryRun).toBe(true)
    })

    it('parses --out flag', () => {
      process.argv = ['node', 'collections', 'db:push', '--out', './custom-drizzle']

      const { options } = parseArgs()

      expect(options.out).toBe('./custom-drizzle')
    })

    it('parses -o short flag', () => {
      process.argv = ['node', 'collections', 'db:push', '-o', './custom-drizzle']

      const { options } = parseArgs()

      expect(options.out).toBe('./custom-drizzle')
    })

    it('parses --config flag', () => {
      process.argv = ['node', 'collections', 'db:push', '--config', './my-config.ts']

      const { options } = parseArgs()

      expect(options.configPath).toBe('./my-config.ts')
    })

    it('parses -c short flag', () => {
      process.argv = ['node', 'collections', 'db:push', '-c', './my-config.ts']

      const { options } = parseArgs()

      expect(options.configPath).toBe('./my-config.ts')
    })

    it('parses --migrations-table flag', () => {
      process.argv = ['node', 'collections', 'db:push', '--migrations-table', 'my_migrations']

      const { options } = parseArgs()

      expect(options.migrationsTable).toBe('my_migrations')
    })

    it('returns default values when no options provided', () => {
      process.argv = ['node', 'collections', 'db:push']

      const { options } = parseArgs()

      expect(options.verbose).toBe(false)
      expect(options.dryRun).toBe(false)
      expect(options.out).toBe('./drizzle')
      expect(options.configPath).toBe('./collections/config.ts')
      expect(options.migrationsTable).toBe('__drizzle_collections')
    })

    it('shows warning when --dry-run used with non-push command', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      process.argv = ['node', 'collections', 'db:generate', '--dry-run']

      parseArgs()

      expect(consoleWarn).toHaveBeenCalledWith('Warning: --dry-run is only applicable to db:push command')

      consoleWarn.mockRestore()
    })

    it('returns null command when no command specified', () => {
      process.argv = ['node', 'collections']

      const { command, options } = parseArgs()

      expect(command).toBeNull()
      expect(options).toBeDefined()
    })

    it('errors when --out value starts with -', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      process.argv = ['node', 'collections', 'db:push', '--out', '-v']

      parseArgs()

      expect(consoleError).toHaveBeenCalledWith('Error: --out requires a value')
      expect(exitMock).toHaveBeenCalledWith(1)

      consoleError.mockRestore()
    })

    it('errors when --config value starts with -', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      process.argv = ['node', 'collections', 'db:push', '--config', '-v']

      parseArgs()

      expect(consoleError).toHaveBeenCalledWith('Error: --config requires a value')
      expect(exitMock).toHaveBeenCalledWith(1)

      consoleError.mockRestore()
    })
  })

  describe('validatePath', () => {
    it('does not exit for valid paths', () => {
      const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never)

      validatePath('./valid/path', 'test')
      expect(exitMock).not.toHaveBeenCalled()

      exitMock.mockRestore()
    })

    it('exits for path traversal attempts', () => {
      const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never)
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {})

      validatePath('../etc/passwd', 'test')

      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Error: test path cannot contain ".." (path traversal not allowed)'
      )
      expect(exitMock).toHaveBeenCalledWith(1)

      exitMock.mockRestore()
      consoleErrorMock.mockRestore()
    })

    it('exits for paths starting with ..', () => {
      const exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never)
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {})

      validatePath('../other', 'test')

      expect(exitMock).toHaveBeenCalledWith(1)

      exitMock.mockRestore()
      consoleErrorMock.mockRestore()
    })
  })

  describe('pgAdapter', () => {
    it('creates adapter with url', () => {
      const adapter = pgAdapter({ url: 'postgres://test:test@localhost:5432/test' })
      expect(adapter.config.url).toBe('postgres://test:test@localhost:5432/test')
      expect(adapter.config.migrationsPath).toBe('./migrations')
    })

    it('creates adapter with custom migrations path', () => {
      const adapter = pgAdapter({
        url: 'postgres://test:test@localhost:5432/test',
        migrationsPath: './custom/migrations'
      })
      expect(adapter.config.migrationsPath).toBe('./custom/migrations')
    })
  })
})
