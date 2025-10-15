import { useLanguageStore } from '@/stores/language'
import { content } from '@/data/content'

export function useContent() {
  const lang = useLanguageStore()

  function t(obj: { fr: string; en: string }): string {
    return obj[lang.locale]
  }

  return { content, t, lang }
}
