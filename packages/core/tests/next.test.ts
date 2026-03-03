import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  withCollections,
  getCollectionsConfig,
  createCollections,
  isNextConfig,
  isCollectionsConfig,
  defaultWithCollectionsOptions,
  type WithCollectionsOptions,
  type WithCollectionsConfig
} from '../src/next'

describe('next module', () => {
  describe('withCollections', () => {
    it('should return a Next.js config with collections property', () => {
      const result = withCollections({})
      expect(result).toBeDefined()
      expect(result.collections).toBeDefined()
    })

    it('should merge with existing Next.js config', () => {
      const existingConfig = {
        reactStrictMode: true,
        swcMinify: true
      }
      const result = withCollections(existingConfig)
      expect(result.reactStrictMode).toBe(true)
      expect(result.swcMinify).toBe(true)
      expect(result.collections).toBeDefined()
    })

    it('should use default options when not provided', () => {
      const result = withCollections({})
      expect(result.collections?.outputDir).toBe('./drizzle')
      // isProduction depends on NODE_ENV - in test env it may be production
      expect(typeof result.collections?.isProduction).toBe('boolean')
    })

    it('should accept custom options', () => {
      const options: WithCollectionsOptions = {
        configPath: './custom/path',
        hotReload: false,
        outputDir: './custom/drizzle'
      }
      const result = withCollections({}, options)
      expect(result.collections?.outputDir).toBe('./custom/drizzle')
    })

    it('should pass through webpack config when provided', () => {
      const webpackFn = vi.fn((config: unknown) => config)
      const result = withCollections({ webpack: webpackFn })
      expect(result.webpack).toBeDefined()
    })

    it('should call webpack function with correct context', () => {
      const webpackFn = vi.fn((config: unknown) => config)
      const result = withCollections({ webpack: webpackFn })
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
    })

    it('should not have webpack when not provided', () => {
      const result = withCollections({})
      expect(result.webpack).toBeUndefined()
    })
  })

  describe('getCollectionsConfig', () => {
    it('should return collections config when present', () => {
      const config: WithCollectionsConfig = {
        collections: {
          collections: {} as any,
          outputDir: './drizzle',
          isProduction: true
        }
      }
      const result = getCollectionsConfig(config)
      expect(result).toBeDefined()
      expect(result?.outputDir).toBe('./drizzle')
      expect(result?.isProduction).toBe(true)
    })

    it('should return undefined when collections not present', () => {
      const config = { reactStrictMode: true }
      const result = getCollectionsConfig(config as WithCollectionsConfig)
      expect(result).toBeUndefined()
    })
  })

  describe('createCollections', () => {
    it('should return collections, db, and config properties', () => {
      const result = createCollections()
      expect(result).toHaveProperty('collections')
      expect(result).toHaveProperty('db')
      expect(result).toHaveProperty('config')
    })

    it('should return null for db and config', () => {
      const result = createCollections()
      expect(result.db).toBeNull()
      expect(result.config).toBeNull()
    })

    it('should return empty collections object', () => {
      const result = createCollections()
      expect(result.collections).toEqual({})
    })
  })

  describe('isNextConfig', () => {
    it('should return true for valid object config', () => {
      const config = { reactStrictMode: true }
      expect(isNextConfig(config)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isNextConfig(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNextConfig(undefined)).toBe(false)
    })

    it('should return false for primitive', () => {
      expect(isNextConfig('string')).toBe(false)
      expect(isNextConfig(123)).toBe(false)
    })
  })

  describe('isCollectionsConfig', () => {
    it('should return true when collections property exists', () => {
      const config = {
        collections: {
          collections: {},
          outputDir: './drizzle',
          isProduction: true
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

    it('should return false for primitive', () => {
      expect(isCollectionsConfig('string')).toBe(false)
    })
  })

  describe('defaultWithCollectionsOptions', () => {
    it('should have correct default values', () => {
      expect(defaultWithCollectionsOptions.configPath).toBe('./collections/config')
      expect(defaultWithCollectionsOptions.hotReload).toBe(true)
      expect(defaultWithCollectionsOptions.outputDir).toBe('./drizzle')
    })

    it('should be a required version of WithCollectionsOptions', () => {
      const options: WithCollectionsOptions = defaultWithCollectionsOptions
      expect(options.configPath).toBeDefined()
      expect(options.hotReload).toBeDefined()
      expect(options.outputDir).toBeDefined()
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
      const result = withCollections({})
      expect(result.collections?.isProduction).toBe(false)
    })

    it('should detect production mode', () => {
      process.env.NODE_ENV = 'production'
      const result = withCollections({})
      expect(result.collections?.isProduction).toBe(true)
    })
  })
})
