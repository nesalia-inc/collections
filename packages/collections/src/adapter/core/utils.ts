/**
 * Utility functions for the adapter layer
 */

/**
 * Convert camelCase or PascalCase to snake_case
 *
 * Handles:
 * - Standard camelCase: 'firstName' → 'first_name'
 * - Trailing acronyms: 'userID' → 'user_id' (not 'user_i_d')
 * - Leading acronyms: 'XMLParser' → 'xml_parser'
 * - Already snake_case: 'created_at' → 'created_at'
 *
 * @example
 * toSnakeCase('firstName') → 'first_name'
 * toSnakeCase('userID') → 'user_id'
 * toSnakeCase('createdAt') → 'created_at'
 * toSnakeCase('UUID') → 'uuid'
 * toSnakeCase('XMLParser') → 'xml_parser'
 */
export const toSnakeCase = (str: string): string =>
  // Handle trailing acronyms (userID → user_id) and standard camelCase (firstName → first_name)
  str.replace(/([a-z])([A-Z])|([A-Z]+)([A-Z][a-z])/g, '$1$3_$2$4').toLowerCase()
