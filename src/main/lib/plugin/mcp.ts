import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'

const ajv = new Ajv({ allErrors: true })
const validatorCache = new Map<string, ValidateFunction>()

export function validateMcpToolArgs(
  cacheKey: string,
  schema: Record<string, unknown> | undefined,
  args: Record<string, unknown>
): string | null {
  if (!schema) return null

  let validate = validatorCache.get(cacheKey)
  if (!validate) {
    validate = ajv.compile(schema)
    validatorCache.set(cacheKey, validate)
  }

  if (validate(args)) return null
  return formatAjvErrors(validate.errors ?? [])
}

function formatAjvErrors(errors: ErrorObject[]): string {
  const parts = errors.map((err) => {
    if (err.keyword === 'required') {
      return `"${String(err.params.missingProperty)}" is required`
    }
    const field = err.instancePath.slice(1) || 'arguments'
    const message = err.message ?? 'is invalid'
    return `${field} ${message}`
  })
  return `Invalid arguments: ${parts.join('; ')}`
}
