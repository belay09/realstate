import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { PublicLocationContent } from '../api/types'
import { AyatPriceCalculator } from '../components/AyatPriceCalculator'
import { useTranslation } from '../context/LocaleContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { resolveDevelopmentZone } from '../lib/listingDisplay'

export function ProjectListingsPage() {
  const { t } = useTranslation()
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const contentQuery = useQuery({
    queryKey: ['public-location-content', 'apartment', projectSlug],
    enabled: Boolean(projectSlug),
    queryFn: async () => {
      const { data } = await api.get<PublicLocationContent>(
        `/public/location-content/apartment/${projectSlug}`,
      )
      return data
    },
  })
  const zone = projectSlug ? resolveDevelopmentZone(projectSlug, null) : ''
  const pageTitle = contentQuery.data?.title || zone || t('pageTitles.apartments')
  usePageTitle(pageTitle)

  const backTo = '/apartments'

  if (!projectSlug) {
    return <p className="text-sm text-red-600">{t('projectBrowse.missingProject')}</p>
  }

  if (contentQuery.isLoading) {
    return <p className="text-body-sm">{t('projectBrowse.loading')}</p>
  }

  if (contentQuery.isError) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-h3">{t('projectBrowse.notFoundTitle')}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{t('projectBrowse.notFoundBody')}</p>
        <Link to="/apartments" className="btn-primary mt-6 inline-flex">
          {t('projectBrowse.backToLocations')}
        </Link>
      </div>
    )
  }

  const content = contentQuery.data

  return (
    <div className="space-y-10 text-left">
      <nav className="text-sm text-fg-muted">
        <Link to={backTo} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          {t('projectBrowse.backToLocations')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{content?.title || zone || projectSlug}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-eyebrow text-brand-700 dark:text-brand-300">Ayat apartments</p>
        <h1 className="mt-2 text-h1">{content?.title || zone || projectSlug}</h1>
        {content?.subtitle ? (
          <p className="mt-1 text-lg text-fg-muted">
            {content.subtitle}
          </p>
        ) : null}
        <p className="mt-4 text-body-sm">
          {content?.description || t('projectBrowse.chooseLayout')}
        </p>
      </header>

      {(content?.video_url || (content?.media?.length ?? 0) > 0) && (
        <section className="space-y-4">
          <h2 className="text-h3">Location media</h2>
          {content?.video_url ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-border">
              <iframe
                src={content.video_url}
                className="h-full w-full"
                title="Location video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {content?.media?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.media.map((m) => (
                <li key={m.id} className="surface overflow-hidden p-0">
                  {m.media_type === 'video' ? (
                    <video src={m.url} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <img src={m.url} alt={m.caption ?? ''} className="aspect-video w-full object-cover" />
                  )}
                  {m.caption ? <p className="px-3 py-2 text-xs text-fg-muted">{m.caption}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {(content?.cards?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="text-h3">Highlights</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content?.cards.map((card, idx) => (
              <li key={`${card.title}-${idx}`} className="surface p-0 overflow-hidden">
                {card.image_url ? (
                  <img src={card.image_url} alt="" className="h-36 w-full object-cover" />
                ) : null}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-fg">{card.title}</h3>
                  {card.body ? <p className="mt-2 text-sm text-fg-muted">{card.body}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="space-y-4">
        <h2 className="text-h3">{t('projectBrowse.priceEstimate')}</h2>
        <AyatPriceCalculator variant="page" initialKind="residential" />
      </section>
    </div>
  )
}
