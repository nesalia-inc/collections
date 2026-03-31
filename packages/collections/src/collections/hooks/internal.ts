// Hook internal monadic machinery - Kleisli composition

// ============================================================================
// Internal Types
// ============================================================================

/**
 * What the user can return to signal early exit
 */
export type UserHookStop<T> = { readonly _stop: true; readonly data: T }

/**
 * Internal monadic status (HookStatus)
 * Continue = keep going, Stop = early exit, Error = threw
 */
export type HookStatus<T> =
  | { readonly _tag: 'Continue'; readonly context: T }
  | { readonly _tag: 'Stop'; readonly context: T }
  | { readonly _tag: 'Error'; readonly error: Error }

/**
 * Internal hook arrow (Kleisli arrow)
 */
type InternalHook<T> = (ctx: T) => Promise<HookStatus<T>>

// ============================================================================
// Constructors
// ============================================================================

/**
 * Continue with the given context
 */
export const continueWith = <T>(context: T): HookStatus<T> => ({
  _tag: 'Continue',
  context,
})

/**
 * Stop (early exit) with the given context
 */
export const stop = <T>(context: T): HookStatus<T> => ({
  _tag: 'Stop',
  context,
})

/**
 * Error with the given error
 */
export const error = <E extends Error>(e: E): HookStatus<never> => ({
  _tag: 'Error',
  error: e,
})

// ============================================================================
// Lift: User function -> Internal Hook
// ============================================================================

/**
 * Lift a user hook handler into an InternalHook (Kleisli arrow)
 * - Handles async/sync return
 * - Detects _stop signal for early exit
 * - Catches errors and wraps them in HookStatus
 */
const lift = <T>(handler: ((ctx: T) => Promise<T> | T) | undefined): InternalHook<T> => {
  return async (ctx: T): Promise<HookStatus<T>> => {
    if (!handler) return { _tag: 'Continue', context: ctx }

    try {
      const result = await handler(ctx)

      // Detect _stop early exit signal
      if (
        result &&
        typeof result === 'object' &&
        '_stop' in result &&
        (result as unknown as UserHookStop<T>)._stop === true
      ) {
        return { _tag: 'Stop', context: (result as unknown as UserHookStop<T>).data }
      }

      // If void/undefined, keep original context; otherwise use returned value
      const nextContext = result || ctx
      return { _tag: 'Continue', context: nextContext }
    } catch (e) {
      return { _tag: 'Error', error: e instanceof Error ? e : new Error(String(e)) }
    }
  }
}

// ============================================================================
// Pipe: Kleisli Composition
// ============================================================================

/**
 * Compose hooks using Kleisli composition (f >=> g)
 * Short-circuits on Stop or Error
 */
export const pipe = <T>(...hooks: InternalHook<T>[]): InternalHook<T> => {
  return async (initialContext: T): Promise<HookStatus<T>> => {
    let current: HookStatus<T> = { _tag: 'Continue', context: initialContext }

    for (const h of hooks) {
      if (current._tag !== 'Continue') return current // Short-circuit
      current = await h(current.context)
    }

    return current
  }
}

// Re-export for use in runner
export { lift }
