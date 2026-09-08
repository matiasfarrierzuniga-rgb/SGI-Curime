import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useToast } from '@/shared/ui/Toast'
import { absenceJustificationsService } from '../api/absenceJustifications.api'

type AssemblyOption = {
  id: number
  title: string
  date: string
  place?: string | null
  type?: string | null
}

type FormState = {
  assemblyId: string
  reason: string
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function inferMimeType(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  return 'application/octet-stream'
}

export function AffiliateAbsenceJustificationPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [assemblies, setAssemblies] = useState<AssemblyOption[]>([])
  const [loadingAssemblies, setLoadingAssemblies] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [form, setForm] = useState<FormState>({ assemblyId: '', reason: '' })

  useEffect(() => {
    let active = true

    absenceJustificationsService.listAssemblies()
      .then((response) => {
        if (!active) return
        setAssemblies(response.data ?? [])
      })
      .catch(() => {
        if (!active) return
        setError('No fue posible cargar las asambleas disponibles en este momento.')
      })
      .finally(() => {
        if (!active) return
        setLoadingAssemblies(false)
      })

    return () => {
      active = false
    }
  }, [])

  const fileError = useMemo(() => {
    if (!selectedFile) return ''

    const mimeType = selectedFile.type || inferMimeType(selectedFile.name)
    const validMime = ACCEPTED_TYPES.includes(mimeType)
    const validExtension = /\.(pdf|jpg|jpeg|png)$/i.test(selectedFile.name)
    const validSize = selectedFile.size > 0 && selectedFile.size <= MAX_FILE_SIZE

    if (!validMime || !validExtension || !validSize) {
      return 'El archivo debe ser PDF, JPG, JPEG o PNG y tener un tamaño máximo de 5 MB.'
    }

    return ''
  }, [selectedFile])

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file) {
      setError('')
    }
  }

  const submit = async () => {
    if (!user || submitting) return

    const assemblyId = Number(form.assemblyId)
    const reason = form.reason.trim()

    if (!assemblyId || !reason) {
      setError('Debes seleccionar una asamblea y escribir un motivo válido.')
      return
    }

    if (reason.length < 20) {
      setError('El motivo debe tener al menos 20 caracteres para ser válido.')
      return
    }

    if (fileError) {
      setError(fileError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        assemblyId,
        reason,
        attachment: selectedFile
          ? {
              originalName: selectedFile.name,
              mimeType: selectedFile.type || inferMimeType(selectedFile.name),
              size: selectedFile.size,
            }
          : undefined,
      }

      await absenceJustificationsService.createForAffiliate(user.id, payload)
      notify('Tu justificación fue registrada y quedó en estado Pendiente.', 'success')
      setForm({ assemblyId: '', reason: '' })
      setSelectedFile(null)
      const input = document.getElementById('evidence-file') as HTMLInputElement | null
      if (input) input.value = ''
    } catch (reasonError) {
      setError(getErrorMessage(reasonError, 'No fue posible registrar la justificación.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        context="Afiliado"
        title="Justificar una ausencia"
        description="Selecciona la asamblea a la que no asististe, describe el motivo y adjunta la evidencia que respalde tu ausencia."
      />

      <div className="rounded-2xl border border-border-default bg-surface-card p-6 shadow-sm">
        {error ? (
          <div className="mb-5 rounded-md border border-status-danger/30 bg-status-danger-surface p-3 text-sm text-status-danger" role="alert">
            {error}
          </div>
        ) : null}

        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="grid gap-2">
            <label htmlFor="absence-assembly" className="font-semibold text-text-primary">Asamblea</label>
            <select
              id="absence-assembly"
              value={form.assemblyId}
              onChange={(event) => setForm((current) => ({ ...current, assemblyId: event.target.value }))}
              className="min-h-11 rounded-md border border-border-default bg-surface px-3 text-sm"
              disabled={loadingAssemblies || submitting}
            >
              <option value="">Selecciona una asamblea</option>
              {assemblies.map((assembly) => (
                <option key={assembly.id} value={assembly.id}>
                  {assembly.title} • {new Date(assembly.date).toLocaleDateString('es-CR', { dateStyle: 'medium' })}
                </option>
              ))}
            </select>
            {loadingAssemblies ? <p className="text-sm text-text-secondary">Cargando asambleas disponibles…</p> : null}
          </div>

          <div className="grid gap-2">
            <label htmlFor="absence-reason" className="font-semibold text-text-primary">Motivo</label>
            <textarea
              id="absence-reason"
              className="min-h-32 rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
              placeholder="Explica con claridad por qué no pudiste asistir."
              maxLength={2000}
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              disabled={submitting}
            />
            <p className="text-xs text-text-secondary">Escribe al menos 20 caracteres. La justificación queda en estado Pendiente.</p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="evidence-file" className="font-semibold text-text-primary">Evidencia</label>
            <input
              id="evidence-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
              onChange={onFileChange}
              disabled={submitting}
              className="block w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
            />
            <p className="text-xs text-text-secondary">
              Formatos permitidos: PDF, JPG, JPEG y PNG. Tamaño máximo: 5 MB.
            </p>
            {selectedFile ? (
              <p className="text-xs text-text-secondary">
                Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            ) : null}
            {fileError ? <p className="text-xs text-status-danger">{fileError}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="submit" className="min-h-11 rounded-control bg-brand-deep px-5 font-semibold text-brand-ivory disabled:cursor-not-allowed disabled:opacity-70" disabled={submitting || loadingAssemblies}>
              {submitting ? 'Enviando…' : 'Enviar justificación'}
            </button>
            <span className="text-sm text-text-secondary">La solicitud será revisada por la administración.</span>
          </div>
        </form>
      </div>
    </section>
  )
}
