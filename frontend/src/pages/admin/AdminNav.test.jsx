import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminNav from './AdminNav'

describe('AdminNav', () => {
  it('affiche les liens vers les deux pages admin', () => {
    render(
      <MemoryRouter>
        <AdminNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Événements' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Utilisateurs & inscriptions' })).toHaveAttribute(
      'href',
      '/admin/users'
    )
  })
})
