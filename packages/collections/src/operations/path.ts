// Path - Shared PathProxy implementation for where, order-by, and select

// ============================================================================
// Path Symbol - Internal Symbol to store path on proxy
// ============================================================================

export const PathSymbol = Symbol('Path')

export type PathSegment = string | number

// ============================================================================
// Path Proxy - Records field path via internal Symbol
// ============================================================================

export type PathProxy<T> = {
  [K in keyof T]: PathProxy<T[K]>
} & {
  [Symbol.iterator](): Iterator<PathSegment>
  (value: unknown): unknown
}

// Create a path proxy that stores accumulated path via Symbol
export function createPathProxy<T>(path: PathSegment[] = []): PathProxy<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: any = function (this: unknown): unknown {
    return undefined
  }

  Object.defineProperty(target, PathSymbol, {
    value: path,
    writable: false,
    enumerable: false,
    configurable: true,
  })

  return new Proxy(target, {
    get(_target, prop) {
      if (prop === PathSymbol) {
        return path
      }
      if (prop === Symbol.iterator) {
        return function* () {
          yield* path
        }
      }
      const currentPath = Reflect.get(target, PathSymbol) as PathSegment[]
      const propStr = String(prop)
      const newPath = [...currentPath, propStr]
      return createPathProxy<T>(newPath)
    },
  })
}

// Extract path from a PathProxy via internal Symbol
export function extractPath<T>(proxy: PathProxy<T>): PathSegment[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = Reflect.get(proxy as any, PathSymbol) as PathSegment[] | undefined
  return path ?? []
}

// Convert path segments to field string (e.g., ['author', 'name'] -> 'author.name')
export function pathToField(path: PathSegment[]): string {
  return path.join('.')
}
