import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"
import PhoneInput, { parsePhoneNumber, type Value } from "react-phone-number-input"
import labels from "react-phone-number-input/locale/es"
import "react-phone-number-input/style.css"

import { cn } from "@/shared/lib/utils"
import { normalizePhoneCountryCode, normalizePhoneNationalNumber } from "@/shared/lib/formValidation"

export interface PhoneValue {
  countryCode?: string
  nationalNumber?: string
}

const PhoneNumberInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  (props, ref) => <input ref={ref} {...props} />,
)
PhoneNumberInput.displayName = 'PhoneNumberInput'

interface PhoneFieldProps {
  id: string
  label: ReactNode
  value: PhoneValue
  onChange: (value: PhoneValue) => void
  description?: ReactNode
  error?: ReactNode
  disabled?: boolean
  required?: boolean
  reserveMessageSpace?: boolean
  className?: string
}

function toInternationalValue(value: PhoneValue): Value | undefined {
  if (!value.countryCode || !value.nationalNumber) return undefined

  return parsePhoneNumber(`${normalizePhoneCountryCode(value.countryCode)}${normalizePhoneNationalNumber(value.nationalNumber)}`)?.number
}

export function PhoneField({
  id,
  label,
  value,
  onChange,
  description,
  error,
  disabled = false,
  required = false,
  reserveMessageSpace = false,
  className,
}: PhoneFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = `${id}-error`
  const labelId = `${id}-label`
  const accessibleLabel = typeof label === 'string' ? label : 'Número de teléfono'
  const describedBy = [reserveMessageSpace && error ? undefined : descriptionId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined

  function handleChange(nextValue?: Value) {
    if (!nextValue) {
      onChange({})
      return
    }

    const phone = parsePhoneNumber(nextValue)
    onChange(phone
      ? { countryCode: `+${phone.countryCallingCode}`, nationalNumber: normalizePhoneNationalNumber(phone.nationalNumber) }
      : {})
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label id={labelId} className="text-label font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (requerido)</span>}
        {!required && <span className="text-muted-foreground"> (opcional)</span>}
      </label>
      <PhoneInput
        id={id}
        aria-label={accessibleLabel}
        className={cn(
          "flex h-(--size-control) w-full min-w-0 items-center rounded-control border border-border bg-control px-(--spacing-control-x) py-0 text-base text-foreground transition-[border-color,box-shadow] hover:border-border-strong focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-control-disabled has-[:disabled]:opacity-50 md:text-sm",
          "[&_.PhoneInputCountry]:mr-3 [&_.PhoneInputCountry]:h-full [&_.PhoneInputCountry]:shrink-0 [&_.PhoneInputCountry]:self-center [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-border-subtle [&_.PhoneInputCountry]:pr-3",
          "[&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:overflow-hidden [&_.PhoneInputCountryIcon]:rounded-[0.125rem] [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:appearance-none [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect:disabled]:cursor-not-allowed",
          "[&_.PhoneInputCountrySelectArrow]:ml-2 [&_.PhoneInputCountrySelectArrow]:text-foreground-muted [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:text-foreground [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:ring-0 [&_.PhoneInputInput]:placeholder:text-muted-foreground [&_.PhoneInputInput:focus]:bg-transparent [&_.PhoneInputInput:focus]:ring-0 [&_.PhoneInputInput:disabled]:cursor-not-allowed [&_.PhoneInputInput:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_var(--color-control)_inset] [&_.PhoneInputInput:-webkit-autofill]:[-webkit-text-fill-color:var(--color-foreground)] [&_.PhoneInputInput:-webkit-autofill]:[caret-color:var(--color-foreground)]",
          error && "border-destructive hover:border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        )}
        defaultCountry="CR"
        international={false}
        disabled={disabled}
        labels={labels}
        inputComponent={PhoneNumberInput}
        numberInputProps={{
          "aria-labelledby": labelId,
          "aria-describedby": describedBy,
          'aria-invalid': Boolean(error),
          autoComplete: 'tel',
          inputMode: 'tel',
          required,
        }}
        onChange={handleChange}
        value={toInternationalValue(value)}
      />
      {reserveMessageSpace ? <div className="min-h-5">
        {error ? <p id={errorId} className="text-body-small font-medium text-destructive" role="alert">{error}</p> : description ? <p id={descriptionId} className="text-body-small text-muted-foreground">{description}</p> : null}
      </div> : <>
        {description && <p id={descriptionId} className="text-body-small text-muted-foreground">{description}</p>}
        {error && <p id={errorId} className="text-body-small font-medium text-destructive" role="alert">{error}</p>}
      </>}
    </div>
  )
}

export type { PhoneFieldProps }
