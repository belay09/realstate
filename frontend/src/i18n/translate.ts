import type { Messages } from './locales/en'

type Primitive = string | number
type Params = Record<string, Primitive>

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''))
}

export function createTranslator(messages: Messages) {
  return function t(path: string, params?: Params): string {
    const value = getNested(messages as unknown as Record<string, unknown>, path)
    if (typeof value === 'string') {
      return interpolate(value, params)
    }
    return path
  }
}

export type Translator = ReturnType<typeof createTranslator>
