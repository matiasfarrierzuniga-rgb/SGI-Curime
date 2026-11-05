import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubmitVolunteerApplication } from '../hooks/usePublicOpportunities'
import { VolunteerApplicationForm } from './VolunteerApplicationForm'

vi.mock('../hooks/usePublicOpportunities', () => ({ useSubmitVolunteerApplication: vi.fn() }))

const mutateAsync = vi.fn()

describe('VolunteerApplicationForm', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(useSubmitVolunteerApplication).mockReturnValue({ isPending: false, isSuccess: false, mutateAsync } as never) })

  it('requires a name and at least one contact method', () => {
    render(<VolunteerApplicationForm opportunityId={4} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }))
    expect(screen.getByText('Ingrese su nombre completo.')).toBeInTheDocument()
    expect(screen.getByText('Indique al menos un correo electrónico o teléfono.')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('normalizes email and submits without a session', async () => {
    mutateAsync.mockResolvedValue({ received: true })
    render(<VolunteerApplicationForm opportunityId={4} />)
    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: ' ANA@EXAMPLE.TEST ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar postulación' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ fullName: 'Ana Pérez', email: 'ana@example.test', phoneCountryCode: undefined, phoneNationalNumber: undefined, motivation: undefined }))
  })

  it('shows the pending-review confirmation after success', () => {
    vi.mocked(useSubmitVolunteerApplication).mockReturnValue({ isPending: false, isSuccess: true, mutateAsync } as never)
    render(<VolunteerApplicationForm opportunityId={4} />)
    expect(screen.getByRole('status')).toHaveTextContent('Tu postulación fue recibida correctamente y queda pendiente de revisión por la asociación.')
  })
})
