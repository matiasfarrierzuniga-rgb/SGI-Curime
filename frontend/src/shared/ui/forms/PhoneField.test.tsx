import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PhoneField, type PhoneValue } from './PhoneField'

function ControlledPhoneField() {
  const [value, setValue] = useState<PhoneValue>({ countryCode: '+506', nationalNumber: '' })
  return <><PhoneField id="phone" label="Teléfono" value={value} onChange={setValue} error="" /><output>{JSON.stringify(value)}</output></>
}

describe('PhoneField', () => {
  it('formats Costa Rican input visually while returning normalized values', () => {
    render(<ControlledPhoneField />)

    const input = screen.getByRole('textbox', { name: /Teléfono/ })
    fireEvent.change(input, { target: { value: '88888888' } })

    expect(input).toHaveValue('8888 8888')
    expect(screen.getByRole('status')).toHaveTextContent('{"countryCode":"+506","nationalNumber":"88888888"}')
  })

  it('associates inline errors with phone input', () => {
    render(<PhoneField id="phone-error" label="Teléfono" value={{}} onChange={() => undefined} error="Teléfono de Costa Rica: debe contener exactamente 8 dígitos." />)

    expect(screen.getByRole('textbox', { name: /Teléfono/ })).toHaveAttribute('aria-describedby', 'phone-error-error')
    expect(screen.getByRole('alert')).toHaveTextContent('exactamente 8 dígitos')
  })
})
