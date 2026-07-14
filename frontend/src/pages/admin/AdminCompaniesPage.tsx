import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'

import { api } from '../../api/client'
import type { Company, Paginated } from '../../api/types'

type CompanyEditFields = {
  website: string
  logo_url: string
  description: string
  is_active: boolean
}

/**
 * Admin Companies - source of truth for the public home developers section.
 *
 * Fill for each active partner shown on `/`:
 * - Name (required)
 * - Website (optional official site)
 * - Logo URL (e.g. `/partners/ayat.svg` or a CDN URL)
 * - Description (short blurb on home cards)
 * - Active (must be on to appear at GET /public/companies)
 */
export function AdminCompaniesPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<CompanyEditFields | null>(null)

  const list = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Company>>('/admin/companies', {
        params: { limit: 100 },
      })
      return data
    },
  })

  const create = useMutation({
    mutationFn: (body: {
      name: string
      website?: string
      logo_url?: string
      description?: string
      is_active: boolean
    }) => api.post('/admin/companies', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'companies'] }),
  })

  const update = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: {
        website: string | null
        logo_url: string | null
        description: string | null
        is_active: boolean
      }
    }) => api.patch(`/admin/companies/${id}`, body),
    onSuccess: () => {
      setEditingId(null)
      setDraft(null)
      qc.invalidateQueries({ queryKey: ['admin', 'companies'] })
    },
  })

  function startEdit(c: Company) {
    setEditingId(c.id)
    setDraft({
      website: c.website ?? '',
      logo_url: c.logo_url ?? '',
      description: c.description ?? '',
      is_active: c.is_active,
    })
  }

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Companies</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Partner developers on the home page (Ayat, Temer, …). Appears on home page when Active -
          set logo, website, and short description. Next:{' '}
          <Link to="/admin/listings" className="font-medium text-brand-700 underline dark:text-brand-400">
            Locations
          </Link>{' '}
          → floor m² rates.
        </p>
      </div>

      <form
        className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const website = String(fd.get('website') || '').trim()
          const logo_url = String(fd.get('logo_url') || '').trim()
          const description = String(fd.get('description') || '').trim()
          create.mutate({
            name: String(fd.get('name')),
            website: website || undefined,
            logo_url: logo_url || undefined,
            description: description || undefined,
            is_active: fd.get('is_active') === 'on',
          })
          e.currentTarget.reset()
        }}
      >
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">New company</h2>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Name
          <input name="name" required className="input" placeholder="Ayat Real Estate" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Website
          <input name="website" className="input" placeholder="https://ayatrealestate.com/" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Logo URL
          <input name="logo_url" className="input" placeholder="/partners/ayat.svg" />
        </label>
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
          Description (home card)
          <textarea
            name="description"
            rows={2}
            className="input"
            placeholder="Short blurb shown under the developer name on the home page."
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
          <input name="is_active" type="checkbox" defaultChecked className="rounded border-stone-400" />
          Active - appears on home page
        </label>
        <button type="submit" className="btn-primary" disabled={create.isPending}>
          Create
        </button>
        {create.isError && (
          <p className="text-xs text-red-600">{(create.error as Error).message}</p>
        )}
      </form>

      {list.isLoading && <p className="text-sm text-stone-500">Loading…</p>}
      {list.isError && <p className="text-sm text-red-600">Failed to load companies.</p>}

      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-800">
          <thead className="bg-stone-100 dark:bg-stone-900">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Logo / site</th>
              <th className="px-3 py-2 text-left font-medium">Active</th>
              <th className="px-3 py-2 text-left font-medium"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-950">
            {list.data?.items.map((c) => (
              <tr key={c.id} className="align-top">
                <td className="px-3 py-2 font-medium text-stone-900 dark:text-stone-100">
                  {c.name}
                  {c.description ? (
                    <p className="mt-1 max-w-xs text-xs font-normal text-stone-500 line-clamp-2">
                      {c.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{c.slug}</td>
                <td className="px-3 py-2 text-xs text-stone-600 dark:text-stone-400">
                  {c.logo_url ? <div className="truncate max-w-[12rem]">{c.logo_url}</div> : '-'}
                  {c.website ? (
                    <a
                      href={c.website}
                      className="mt-1 block truncate max-w-[12rem] text-brand-700 hover:underline dark:text-brand-400"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {c.website}
                    </a>
                  ) : null}
                </td>
                <td className="px-3 py-2">{c.is_active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-brand-700 hover:underline dark:text-brand-400"
                      onClick={() => (editingId === c.id ? (setEditingId(null), setDraft(null)) : startEdit(c))}
                    >
                      {editingId === c.id ? 'Cancel' : 'Edit'}
                    </button>
                    <Link
                      className="text-brand-700 hover:underline dark:text-brand-400"
                      to="/admin/listings"
                    >
                      Locations →
                    </Link>
                  </div>
                  {editingId === c.id && draft ? (
                    <div className="mt-2 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900">
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        Website
                        <input
                          className="input"
                          value={draft.website}
                          onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                        />
                      </label>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        Logo URL
                        <input
                          className="input"
                          value={draft.logo_url}
                          onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
                          placeholder="/partners/ayat.svg"
                        />
                      </label>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        Description
                        <textarea
                          className="input"
                          rows={2}
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                        <input
                          type="checkbox"
                          checked={draft.is_active}
                          onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                          className="rounded border-stone-400"
                        />
                        Active - appears on home page
                      </label>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({
                            id: c.id,
                            body: {
                              website: draft.website.trim() || null,
                              logo_url: draft.logo_url.trim() || null,
                              description: draft.description.trim() || null,
                              is_active: draft.is_active,
                            },
                          })
                        }
                      >
                        Save
                      </button>
                      {update.isError && (
                        <p className="text-xs text-red-600">{(update.error as Error).message}</p>
                      )}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
