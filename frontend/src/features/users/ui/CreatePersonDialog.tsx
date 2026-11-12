import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, identificationMaxLength, phoneNationalMaxLength } from '@/shared/lib/formValidation'
import { createPersonSchema, type CreatePersonFormValues } from '../model/createPerson.schema'
import type { CreatePersonInput } from '../model/users.types'

type Props = {
  busy: boolean
  error: unknown
  onClose: () => void
  onConfirm: (input: CreatePersonInput) => void
}

function FieldMessage({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="text-body-small font-medium text-destructive">{message}</p> : null
}

function registrationErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const data = error.response.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) return data.message.join('. ')
    if (typeof data?.message === 'string') return data.message
  }
  return getErrorMessage(error, 'No fue posible registrar la Persona.')
}

export function CreatePersonDialog({ busy, error, onClose, onConfirm }: Props) {
  const form = useForm<CreatePersonFormValues>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      identificationType: 'NATIONAL',
      identification: '',
      firstName: '',
      firstSurname: '',
      secondSurname: '',
      phoneCountryCode: '',
      phoneNationalNumber: '',
      address: '',
      reason: '',
    },
  })
  const identificationType = form.watch('identificationType')
  const phoneCountryCode = form.watch('phoneCountryCode')
  const identificationField = form.register('identification')
  const phoneField = form.register('phoneNationalNumber')
  const serverError = error ? registrationErrorMessage(error) : null

  const submit = form.handleSubmit((values) => {
    if (busy) return
    const countryCode = values.phoneCountryCode.trim()
    const nationalNumber = values.phoneNationalNumber.trim()
    const address = values.address.trim()
    const secondSurname = values.secondSurname.trim()

    onConfirm({
      identificationType: values.identificationType,
      identification: values.identification.trim(),
      firstName: values.firstName.trim(),
      firstSurname: values.firstSurname.trim(),
      ...(secondSurname ? { secondSurname } : {}),
      ...(countryCode && nationalNumber ? { phoneCountryCode: countryCode, phoneNationalNumber: nationalNumber } : {}),
      ...(address ? { address } : {}),
      reason: values.reason.trim(),
    })
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <DialogContent size="lg">
        <form className="grid gap-6" onSubmit={submit} noValidate>
          <DialogHeader className="pr-8">
            <DialogTitle>Registrar Persona</DialogTitle>
            <DialogDescription>
              Cree una Persona canónica para vincularla después a una cuenta SGI. Esta acción no asigna roles, no vincula cuentas y no crea afiliaciones ni nombramientos.
            </DialogDescription>
          </DialogHeader>

          <section aria-labelledby="person-identity-heading" className="grid gap-4">
            <div>
              <h3 id="person-identity-heading" className="text-heading-3 font-semibold text-text-primary">Identidad</h3>
              <p className="mt-1 text-body-small text-text-secondary">Use los datos exactos de la identificación oficial. La identificación no se muestra completa en auditoría.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="person-identification-type">Tipo de identificación</FieldLabel>
                <Select
                  id="person-identification-type"
                  aria-invalid={Boolean(form.formState.errors.identificationType)}
                  aria-describedby={form.formState.errors.identificationType ? 'person-identification-type-error' : undefined}
                  {...form.register('identificationType')}
                >
                  <option value="NATIONAL">Cédula nacional</option>
                  <option value="DIMEX">DIMEX</option>
                </Select>
                <FieldMessage id="person-identification-type-error" message={form.formState.errors.identificationType?.message} />
              </Field>
              <Field>
                <FieldLabel htmlFor="person-identification">Identificación</FieldLabel>
                <Input
                  id="person-identification"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={identificationMaxLength(identificationType)}
                  aria-invalid={Boolean(form.formState.errors.identification)}
                  aria-describedby={form.formState.errors.identification ? 'person-identification-error' : undefined}
                  {...identificationField}
                  onChange={(event) => {
                    void form.setValue(
                      'identification',
                      digitsOnly(event.target.value, identificationMaxLength(identificationType)),
                      { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
                    )
                  }}
                />
                <FieldMessage id="person-identification-error" message={form.formState.errors.identification?.message} />
              </Field>
              <Field>
                <FieldLabel htmlFor="person-first-name">Nombre</FieldLabel>
                <Input
                  id="person-first-name"
                  autoComplete="given-name"
                  maxLength={150}
                  aria-invalid={Boolean(form.formState.errors.firstName)}
                  aria-describedby={form.formState.errors.firstName ? 'person-first-name-error' : undefined}
                  {...form.register('firstName')}
                />
                <FieldMessage id="person-first-name-error" message={form.formState.errors.firstName?.message} />
              </Field>
              <Field>
                <FieldLabel htmlFor="person-first-surname">Primer apellido</FieldLabel>
                <Input
                  id="person-first-surname"
                  autoComplete="family-name"
                  maxLength={150}
                  aria-invalid={Boolean(form.formState.errors.firstSurname)}
                  aria-describedby={form.formState.errors.firstSurname ? 'person-first-surname-error' : undefined}
                  {...form.register('firstSurname')}
                />
                <FieldMessage id="person-first-surname-error" message={form.formState.errors.firstSurname?.message} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="person-second-surname">Segundo apellido</FieldLabel>
                <FieldDescription>Opcional. Puede completarse después si la Persona ya existe.</FieldDescription>
                <Input
                  id="person-second-surname"
                  autoComplete="family-name"
                  maxLength={150}
                  aria-invalid={Boolean(form.formState.errors.secondSurname)}
                  aria-describedby={form.formState.errors.secondSurname ? 'person-second-surname-error' : undefined}
                  {...form.register('secondSurname')}
                />
                <FieldMessage id="person-second-surname-error" message={form.formState.errors.secondSurname?.message} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="person-contact-heading" className="grid gap-4 border-t border-border-default pt-5">
            <div>
              <h3 id="person-contact-heading" className="text-heading-3 font-semibold text-text-primary">Contacto opcional</h3>
              <p className="mt-1 text-body-small text-text-secondary">Estos datos se guardan en la Persona canónica, no en la cuenta SGI.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="person-phone-country-code">Código de país</FieldLabel>
                <Input
                  id="person-phone-country-code"
                  autoComplete="tel-country-code"
                  placeholder="+506"
                  maxLength={5}
                  aria-invalid={Boolean(form.formState.errors.phoneNationalNumber)}
                  aria-describedby={form.formState.errors.phoneNationalNumber ? 'person-phone-error' : undefined}
                  {...form.register('phoneCountryCode')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="person-phone-national-number">Número telefónico</FieldLabel>
                <Input
                  id="person-phone-national-number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={phoneNationalMaxLength(phoneCountryCode)}
                  aria-invalid={Boolean(form.formState.errors.phoneNationalNumber)}
                  aria-describedby={form.formState.errors.phoneNationalNumber ? 'person-phone-error' : undefined}
                  {...phoneField}
                  onChange={(event) => {
                    void form.setValue(
                      'phoneNationalNumber',
                      digitsOnly(event.target.value, phoneNationalMaxLength(phoneCountryCode)),
                      { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
                    )
                  }}
                />
                <FieldMessage id="person-phone-error" message={form.formState.errors.phoneNationalNumber?.message} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="person-address">Dirección</FieldLabel>
                <Input
                  id="person-address"
                  autoComplete="street-address"
                  maxLength={300}
                  aria-invalid={Boolean(form.formState.errors.address)}
                  aria-describedby={form.formState.errors.address ? 'person-address-error' : undefined}
                  {...form.register('address')}
                />
                <FieldMessage id="person-address-error" message={form.formState.errors.address?.message} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="person-reason-heading" className="grid gap-3 border-t border-border-default pt-5">
            <div>
              <h3 id="person-reason-heading" className="text-heading-3 font-semibold text-text-primary">Motivo administrativo</h3>
              <p className="mt-1 text-body-small text-text-secondary">Quedará registrado en auditoría junto con el actor y el resultado de la operación.</p>
            </div>
            <Field>
              <FieldLabel htmlFor="person-reason">Motivo</FieldLabel>
              <Textarea
                id="person-reason"
                maxLength={500}
                aria-invalid={Boolean(form.formState.errors.reason)}
                aria-describedby={form.formState.errors.reason ? 'person-reason-error' : undefined}
                {...form.register('reason')}
              />
              <FieldMessage id="person-reason-error" message={form.formState.errors.reason?.message} />
            </Field>
          </section>

          {serverError ? <p id="create-person-server-error" role="alert" className="rounded-control border border-status-error-border bg-status-error-surface px-3 py-2 text-body-small font-medium text-status-error-foreground">{serverError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button type="submit" loading={busy}>Registrar Persona</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
