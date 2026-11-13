import type { UseFormReturn } from 'react-hook-form'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import type { AffiliationFormValues } from '../model/affiliation.schema'
import { useTerritorialCatalog } from '../hooks/useTerritorialCatalogQueries'
import { Select } from '@/shared/ui/select'
import { FormField } from '@/shared/ui/FormField'

type Props = { form: UseFormReturn<AffiliationFormValues> }

export function TerritorialSelectors({ form }: Props) {
  const provinceCode = form.watch('provinceCode')
  const cantonCode = form.watch('cantonCode')
  const districtCode = form.watch('districtCode')
  const { provinces, cantons, districts, localities } = useTerritorialCatalog(provinceCode, cantonCode, districtCode)
  const queries = [provinces, cantons, districts, localities]
  const unavailable = queries.some((query) => query.isError)
  const catalogVersion = provinces.data?.catalogVersion
    ?? cantons.data?.catalogVersion ?? districts.data?.catalogVersion ?? localities.data?.catalogVersion
  const choose = (field: 'provinceCode' | 'cantonCode' | 'districtCode' | 'localityKey', value: string) => {
    form.setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    if (field === 'provinceCode') {
      form.setValue('cantonCode', ''); form.setValue('districtCode', ''); form.setValue('localityKey', ''); form.setValue('catalogVersion', '')
    }
    if (field === 'cantonCode') { form.setValue('districtCode', ''); form.setValue('localityKey', ''); form.setValue('catalogVersion', '') }
    if (field === 'districtCode') { form.setValue('localityKey', ''); form.setValue('catalogVersion', '') }
    if (field === 'localityKey') form.setValue('catalogVersion', catalogVersion ?? '', { shouldDirty: true, shouldValidate: true })
  }
  const pending = queries.some((query) => query.isFetching)

  return <fieldset className="grid gap-4 rounded-surface border border-border-subtle bg-surface-muted/40 p-4 md:grid-cols-2 md:gap-5">
    <legend className="px-1 text-label font-semibold text-text-primary">Referencia territorial declarada <span className="font-normal text-text-secondary">(opcional)</span></legend>
    <p className="md:col-span-2 text-body-small leading-relaxed text-text-secondary">Seleccione su ubicación declarada. Esta selección no verifica residencia ni determina la aprobación de su solicitud.</p>
    {unavailable ? <p className="md:col-span-2 flex items-center gap-2 rounded-control border border-status-warning-border bg-status-warning-surface px-3 py-2 text-body-small text-status-warning-foreground" role="alert"><CircleAlert aria-hidden="true" className="size-4 shrink-0" />Catálogo territorial no disponible. Puede enviar la solicitud sin esta referencia.</p> : null}
    <TerritorialField id="provinceCode" label="Provincia" disabled={provinces.isLoading || unavailable} value={provinceCode} onChange={(value) => choose('provinceCode', value)} items={provinces.data?.items} loading={provinces.isFetching} />
    <TerritorialField id="cantonCode" label="Cantón" disabled={!provinceCode || cantons.isLoading || unavailable} value={cantonCode} onChange={(value) => choose('cantonCode', value)} items={cantons.data?.items} loading={cantons.isFetching} />
    <TerritorialField id="districtCode" label="Distrito" disabled={!cantonCode || districts.isLoading || unavailable} value={districtCode} onChange={(value) => choose('districtCode', value)} items={districts.data?.items} loading={districts.isFetching} />
      <FormField id="localityKey" label="Localidad" description={pending ? <span className="inline-flex items-center gap-1"><LoaderCircle aria-hidden="true" className="size-3 animate-spin motion-reduce:animate-none" />Actualizando opciones…</span> : undefined} reserveMessageSpace>
      <Select className="h-12" value={form.watch('localityKey')} disabled={!districtCode || localities.isLoading || unavailable} onChange={(event) => choose('localityKey', event.target.value)}>
        <option value="">Seleccione una localidad</option>
        {localities.data?.items.map((item) => <option key={item.localityKey} value={item.localityKey}>{item.name} — {item.category}</option>)}
      </Select>
    </FormField>
  </fieldset>
}

function TerritorialField({ id, label, disabled, value, onChange, items, loading }: { id: 'provinceCode' | 'cantonCode' | 'districtCode'; label: string; disabled: boolean; value: string; onChange: (value: string) => void; items?: { code: string; name: string }[]; loading: boolean }) {
  return <FormField id={id} label={label} description={loading ? 'Cargando opciones…' : undefined} reserveMessageSpace><Select className="h-12" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">Seleccione {label.toLowerCase()}</option>{items?.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select></FormField>
}
