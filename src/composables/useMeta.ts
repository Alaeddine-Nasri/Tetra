import { watch } from 'vue'
import { useLanguageStore } from '@/stores/language'
import { content } from '@/data/content'

export function useMeta() {
  const lang = useLanguageStore()

  function apply() {
    const locale = lang.locale
    document.documentElement.lang = locale
    document.title = content.meta.title[locale]

    setMeta('description',       content.meta.description[locale])
    setMeta('og:title',          content.meta.title[locale])
    setMeta('og:description',    content.meta.description[locale])
    setMeta('og:type',           'website')
    setMeta('og:url',            'https://ala-nasri.dev')
    setMeta('og:image',          'https://ala-nasri.dev/og.jpg')
    setMeta('twitter:card',      'summary_large_image')
    setMeta('twitter:title',     content.meta.title[locale])
    setMeta('twitter:description', content.meta.description[locale])
  }

  function setMeta(nameOrProp: string, val: string) {
    // try property first (og:*), then name
    let el = document.querySelector<HTMLMetaElement>(
      `meta[property="${nameOrProp}"]`
    )
    if (!el) el = document.querySelector<HTMLMetaElement>(
      `meta[name="${nameOrProp}"]`
    )
    if (!el) {
      el = document.createElement('meta')
      if (nameOrProp.startsWith('og:') || nameOrProp.startsWith('twitter:')) {
        el.setAttribute('property', nameOrProp)
      } else {
        el.setAttribute('name', nameOrProp)
      }
      document.head.appendChild(el)
    }
    el.setAttribute('content', val)
  }

  // react to locale changes
  watch(() => lang.locale, apply, { immediate: true })
}
