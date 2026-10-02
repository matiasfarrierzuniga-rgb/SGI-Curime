import type { ReactNode } from "react"
import PhoneInput, { parsePhoneNumber, type Value } from "react-phone-number-input"
import labels from "react-phone-number-input/locale/es"
import "react-phone-number-input/style.css"

import { cn } from "@/shared/lib/utils"

export interface PhoneValue {
  countryCode?: string
  nationalNumber?: string
}

interface PhoneFieldProps {
  id: string
  label: ReactNode
  value: PhoneValue
  onChange: (value: PhoneValue) => void
  description?: ReactNode
  error?: ReactNode
  disabled?: boolean
  required?: boolean
  className?: string
}

function toInternationalValue(value: PhoneValue): Value | undefined {
  if (!value.countryCode || !value.nationalNumber) return undefined

  return parsePhoneNumber(`${value.countryCode}${value.nationalNumber}`)?.number
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
  className,
}: PhoneFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = `${id}-error`
  const describedBy = [descriptionId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined

  function handleChange(nextValue?: Value) {
    if (!nextValue) {
      onChange({})
      return
    }

    const phone = parsePhoneNumber(nextValue)
    onChange(phone
      ? { countryCode: `+${phone.countryCallingCode}`, nationalNumber: phone.nationalNumber }
      : {})
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label className="text-label font-semibold text-foreground" htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (requerido)</span>}
        {!required && <span className="text-muted-foreground"> (opcional)</span>}
      </label>
      <PhoneInput
        id={id}
        className={cn(
          "flex h-(--size-control) w-full min-w-0 items-center rounded-control border border-border bg-control px-(--spacing-control-x) py-(--spacing-control-y) text-base text-foreground transition-[border-color,box-shadow] hover:border-border-strong focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 disabled:cursor-not-allowed disabled:bg-control-disabled disabled:opacity-50 md:text-sm [&_.PhoneInputCountry]:mr-3 [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground",
          error && "border-destructive hover:border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        )}
        defaultCountry="CR"
        disabled={disabled}
        labels={labels}
        numberInputProps={{
          "aria-describedby": describedBy,
          'aria-invalid': Boolean(error),
          autoComplete: 'tel',
          required,
        }}
        onChange={handleChange}
        value={toInternationalValue(value)}
      />
      {description && <p id={descriptionId} className="text-body-small text-muted-foreground">{description}</p>}
      {error && <p id={errorId} className="text-body-small font-medium text-destructive" role="alert">{error}</p>}
    </div>
  )
}

export type { PhoneFieldProps }
