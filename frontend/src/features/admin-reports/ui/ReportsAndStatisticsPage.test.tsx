import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportsAndStatisticsPage } from './ReportsAndStatisticsPage'

const auth = vi.hoisted(() => ({
  permissionCodes: ['adm.affiliates.read'] as string[],
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { permissionCodes: auth.permissionCodes } }),
}))
vi.mock('./AffiliatesReportPage', () => ({
  AffiliatesReportPage: () => <p>Contenido de afiliados</p>,
}))
vi.mock('./AssembliesReportPanel', () => ({
  AssembliesReportPanel: () => <p>Contenido de asambleas</p>,
}))
vi.mock('./VenturesReportPanel', () => ({
  VenturesReportPanel: () => <p>Contenido de emprendimientos</p>,
}))

describe('ReportsAndStatisticsPage', () => {
  beforeEach(() => {
    auth.permissionCodes = ['adm.affiliates.read']
  })

  it('shows only report sections granted by capabilities', () => {
    render(<ReportsAndStatisticsPage />)

    expect(screen.getByRole('button', { name: 'Afiliados' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Asambleas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Emprendimientos' })).not.toBeInTheDocument()
    expect(screen.getByText('Contenido de afiliados')).toBeInTheDocument()
  })

  it('allows authorized users to switch to assembly and venture reports', () => {
    auth.permissionCodes = [
      'adm.affiliates.read',
      'adm.assemblies.read',
      'ent.ventures.read',
    ]
    render(<ReportsAndStatisticsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Asambleas' }))
    expect(screen.getByText('Contenido de asambleas')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Emprendimientos' }))
    expect(screen.getByText('Contenido de emprendimientos')).toBeInTheDocument()
  })
})
