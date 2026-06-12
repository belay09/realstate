import { usePageSeo } from './usePageSeo'

export function usePageTitle(title: string, description?: string) {
  usePageSeo({ title, description })
}
