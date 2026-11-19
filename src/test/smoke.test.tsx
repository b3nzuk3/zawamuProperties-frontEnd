import { render, screen } from '@testing-library/react'
import { it, expect } from 'vitest'
it('renders in jsdom', () => { render(<h1>Harness ready</h1>); expect(screen.getByRole('heading')).toHaveTextContent('Harness ready') })
