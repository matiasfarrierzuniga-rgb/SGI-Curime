import PhoneInput, { parsePhoneNumber, type Value } from 'react-phone-number-input'
import labels from 'react-phone-number-input/locale/es'
import 'react-phone-number-input/style.css'

export interface PhoneValue {
  countryCode?: string
  nationalNumber?: string
}

interface PhoneFieldProps {
  id: string
  label: string
  value: PhoneValue
  onChange: (value: PhoneValue) => void
  error?: string
  disabled?: boolean
  required?: boolean
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
  error,
  disabled = false,
  required = false,
}: PhoneFieldProps) {
  const errorId = `${id}-error`

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
    <div className="grid gap-2">
      <label className="text-sm font-bold" htmlFor={id}>
        {label}{required ? '' : ' (opcional)'}
      </label>
      <PhoneInput
        id={id}
        className="flex min-h-12 w-full items-center rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-50 [&_.PhoneInputCountry]:mr-3 [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-foreground-subtle"
        defaultCountry="CR"
        disabled={disabled}
        labels={labels}
        numberInputProps={{
          'aria-describedby': error ? errorId : undefined,
          'aria-invalid': Boolean(error),
          autoComplete: 'tel',
          required,
        }}
        onChange={handleChange}
        value={toInternationalValue(value)}
      />
      {error && <span id={errorId} className="field-error" role="alert">{error}</span>}
    </div>
  )
}
