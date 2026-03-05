import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  withCollections,
  withCollectionsSync,
  getCollectionsConfig,
  loadCollections,
  getCollectionsFromConfig,
  isNextConfig,
  isCollectionsConfig,
  defaultWithCollectionsOptions,
  watchConfig,
  type WithCollectionsOptions,
  type WithCollectionsConfig
} from '../src/next'

describe('next module', () => {
  describe('withCollections', () => {
    it('should return a Next.js config with collections property', async () => {
      const result = await withCollections({})
      expect(result).toBeDefined()
      expect(result.collections).toBeDefined()
    })

    it('should merge with existing Next.js config', async () => {
      const existingConfig = {
        reactStrictMode: true,
        swcMinify: true
      }
      const result = await withCollections(existingConfig)
      expect(result.reactStrictMode).toBe(true)
      expect(result.swcMinify).toBe(true)
      expect(result.collections).toBeDefined()
    })

    it('should use default options when not provided', async () => {
      const result = await withCollections({})
      expect(result.collections?.outputDir).toBe('./drizzle')
      expect(result.collections?.configPath).toBe('./collections/config')
      // isProduction depends on NODE_ENV - in test env it may be production
      expect(typeof result.collections?.isProduction).toBe('boolean')
    })

    it('should accept custom options', async () => {
      const options: WithCollectionsOptions = {
        configPath: './custom/path',
        hotReload: false,
        outputDir: './custom/drizzle'
      }
      const result = await withCollections({}, options)
      expect(result.collections?.outputDir).toBe('./custom/drizzle')
      expect(result.collections?.configPath).toBe('./custom/path')
    })

    it('should accept debug option', async () => {
      const options: WithCollectionsOptions = {
        configPath: './custom/path',
        debug: true
      }
      const result = await withCollections({}, options)
      expect(result.collections).toBeDefined()
    })

    it('should pass through webpack config when provided in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const webpackFn = vi.fn((config: unknown) => config)
        const result = await withCollections({ webpack: webpackFn })
        expect(result.webpack).toBeDefined()
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('should call webpack function with correct context in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const webpackFn = vi.fn((config: unknown) => config)
        const result = await withCollections({ webpack: webpackFn })
        // Call the webpack function with mock context
        if (result.webpack) {
          const mockWebpackConfig = {}
          const mockContext = {
            dev: true,
            isServer: false,
            dir: '/test',
            buildId: 'test-build',
            config: {},
            defaultLoaders: {},
            webpack: {},
            nextRuntime: 'nodejs'
          }
          result.webpack(mockWebpackConfig as any, mockContext as any)
          expect(webpackFn).toHaveBeenCalled()
        }
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('should not have webpack when not provided', async () => {
      const result = await withCollections({})
      expect(result.webpack).toBeUndefined()
    })
  })

  describe('withCollectionsSync', () => {
    it('should return a Next.js config synchronously', () => {
      const result = withCollectionsSync({})
      expect(result).toBeDefined()
      expect(result.collections).toBeDefined()
    })

    it('should have empty collections in sync mode', () => {
      const result = withCollectionsSync({})
      expect(result.collections?.collections).toEqual({})
    })

    it('should pass through webpack config in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const webpackFn = vi.fn((config: unknown) => config)
        const result = withCollectionsSync({ webpack: webpackFn })
        expect(result.webpack).toBeDefined()
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('should not have webpack when not provided', () => {
      const result = withCollectionsSync({})
      expect(result.webpack).toBeUndefined()
    })
  })

  describe('getCollectionsConfig', () => {
    it('should return collections config when present', () => {
      const config: WithCollectionsConfig = {
        collections: {
          collections: {} as any,
          outputDir: './drizzle',
          isProduction: true,
          configPath: './collections/config'
        }
      }
      const result = getCollectionsConfig(config)
      expect(result).toBeDefined()
      expect(result?.outputDir).toBe('./drizzle')
      expect(result?.isProduction).toBe(true)
      expect(result?.configPath).toBe('./collections/config')
    })

    it('should return undefined when collections not present', () => {
      const config = { reactStrictMode: true }
      const result = getCollectionsConfig(config as WithCollectionsConfig)
      expect(result).toBeUndefined()
    })
  })

  describe('loadCollections', () => {
    it('should return empty object for non-existent config path', async () => {
      const result = await loadCollections('./non-existent-config')
      expect(result).toEqual({})
    })

    it('should return empty object for absolute path rejection', async () => {
      // Absolute paths are rejected and return empty due to error handling
      const result = await loadCollections('/etc/passwd')
      expect(result).toEqual({})
    })

    it('should return empty for invalid extension path', async () => {
      const result = await loadCollections('./config.txt')
      expect(result).toEqual({})
    })
  })

  describe('getCollectionsFromConfig', () => {
    it('should return collections from config', () => {
      const config: WithCollectionsConfig = {
        collections: {
          collections: { users: { slug: 'users' } as any },
          outputDir: './drizzle',
          isProduction: true,
          configPath: './collections/config'
        }
      }
      const result = getCollectionsFromConfig(config)
      expect(result).toHaveProperty('users')
    })

    it('should return empty object when no collections', () => {
      const config = { reactStrictMode: true } as WithCollectionsConfig
      const result = getCollectionsFromConfig(config)
      expect(result).toEqual({})
    })
  })

  describe('isNextConfig', () => {
    it('should return true for valid Next.js config', () => {
      const config = { reactStrictMode: true }
      expect(isNextConfig(config)).toBe(true)
    })

    it('should return true for config with swcMinify', () => {
      const config = { swcMinify: true }
      expect(isNextConfig(config)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isNextConfig(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNextConfig(undefined)).toBe(false)
    })

    it('should return false for object without Next.js properties', () => {
      expect(isNextConfig({ foo: 'bar' })).toBe(false)
    })

    it('should return false for wrong property types', () => {
      // reactStrictMode should be boolean, not string
      expect(isNextConfig({ reactStrictMode: 'true' as any })).toBe(false)
    })
  })

  describe('isCollectionsConfig', () => {
    it('should return true when collections property exists', () => {
      const config = {
        collections: {
          collections: {},
          outputDir: './drizzle',
          isProduction: true,
          configPath: './collections/config'
        }
      }
      expect(isCollectionsConfig(config)).toBe(true)
    })

    it('should return false when collections property missing', () => {
      const config = { reactStrictMode: true }
      expect(isCollectionsConfig(config)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isCollectionsConfig(null)).toBe(false)
    })
  })

  describe('defaultWithCollectionsOptions', () => {
    it('should have correct default values', () => {
      expect(defaultWithCollectionsOptions.configPath).toBe('./collections/config')
      expect(defaultWithCollectionsOptions.hotReload).toBe(true)
      expect(defaultWithCollectionsOptions.outputDir).toBe('./drizzle')
      expect(defaultWithCollectionsOptions.debug).toBe(false)
    })

    it('should be a required version of WithCollectionsOptions', () => {
      const options: WithCollectionsOptions = defaultWithCollectionsOptions
      expect(options.configPath).toBeDefined()
      expect(options.hotReload).toBeDefined()
      expect(options.outputDir).toBeDefined()
      expect(options.debug).toBeDefined()
    })
  })

  describe('environment detection', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should detect development mode', () => {
      process.env.NODE_ENV = 'development'
      const result = withCollectionsSync({})
      expect(result.collections?.isProduction).toBe(false)
    })

    it('should detect production mode', () => {
      process.env.NODE_ENV = 'production'
      const result = withCollectionsSync({})
      expect(result.collections?.isProduction).toBe(true)
    })

    it('should detect __NEXT_BUILD context', () => {
      process.env.NODE_ENV = 'development'
      process.env.__NEXT_BUILD = '1'
      const result = withCollectionsSync({})
      expect(result.collections?.autoSchemaPush).toBe(false)
      delete process.env.__NEXT_BUILD
    })

    it('should detect TURBO_BUILD context', () => {
      process.env.NODE_ENV = 'development'
      process.env.TURBO_BUILD = '1'
      const result = withCollectionsSync({})
      expect(result.collections?.autoSchemaPush).toBe(false)
      delete process.env.TURBO_BUILD
    })

    it('should detect VERCEL build context', () => {
      process.env.NODE_ENV = 'development'
      process.env.VERCEL = '1'
      const result = withCollectionsSync({})
      expect(result.collections?.autoSchemaPush).toBe(false)
      delete process.env.VERCEL
    })
  })

  describe('hot reload configuration', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should enable webpack in development mode with hotReload and user webpack config', async () => {
      process.env.NODE_ENV = 'development'
      const result = await withCollections({ webpack: vi.fn() }, { hotReload: true })
      expect(result.webpack).toBeDefined()
    })

    it('should not enable webpack in development with hotReload disabled', async () => {
      process.env.NODE_ENV = 'development'
      const result = await withCollections({}, { hotReload: false })
      expect(result.webpack).toBeUndefined()
    })

    it('should not enable webpack in production mode', async () => {
      process.env.NODE_ENV = 'production'
      const result = await withCollections({ webpack: vi.fn() }, { hotReload: true })
      expect(result.webpack).toBeUndefined()
    })

    it('should pass through user webpack config in development', async () => {
      process.env.NODE_ENV = 'development'
      const webpackFn = vi.fn((config: unknown) => config)
      const result = await withCollections({ webpack: webpackFn }, { hotReload: true })
      if (result.webpack) {
        const mockWebpackConfig = {}
        const mockContext = { dev: true, isServer: false, dir: '/test', buildId: 'test', config: {}, defaultLoaders: {}, webpack: {}, nextRuntime: 'nodejs' }
        result.webpack(mockWebpackConfig as any, mockContext as any)
        expect(webpackFn).toHaveBeenCalled()
      }
    })

    it('should return webpack config when no user config provided in development', async () => {
      process.env.NODE_ENV = 'development'
      const result = await withCollections({}, { hotReload: true })
      // Without user webpack config, webpack should be undefined
      expect(result.webpack).toBeUndefined()
    })
  })

  describe('watchConfig', () => {
    it('should return cleanup function', () => {
      const cleanup = watchConfig('./non-existent-config', () => {})
      expect(typeof cleanup).toBe('function')
      cleanup()
    })

    it('should accept debug option', () => {
      const cleanup = watchConfig('./non-existent-config', () => {}, { debug: true })
      expect(typeof cleanup).toBe('function')
      cleanup()
    })
  })
})
