import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PlayerCard from './PlayerCard'

const defaults = {
  name: 'Lionel Messi',
  number: 10,
  club: 'Inter Miami',
  position: 'Forward',
  photo: '/assets/messi.jpg',
}

describe('PlayerCard', () => {
  it('renders last name in uppercase', () => {
    render(<PlayerCard {...defaults} />)
    expect(screen.getByText('MESSI')).toBeInTheDocument()
  })

  it('renders jersey number', () => {
    render(<PlayerCard {...defaults} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders club name', () => {
    render(<PlayerCard {...defaults} />)
    expect(screen.getByText('Inter Miami')).toBeInTheDocument()
  })

  it('renders provided photo', () => {
    render(<PlayerCard {...defaults} />)
    const img = screen.getByRole('img', { name: /messi/i })
    expect(img).toHaveAttribute('src', '/assets/messi.jpg')
  })

  it('falls back to /assets/messi.jpg when photo is null', () => {
    render(<PlayerCard {...defaults} photo={null} />)
    const img = screen.getByRole('img', { name: /messi/i })
    expect(img).toHaveAttribute('src', '/assets/messi.jpg')
  })

  it('falls back to /assets/messi.jpg when photo is undefined', () => {
    render(<PlayerCard {...defaults} photo={undefined} />)
    const img = screen.getByRole('img', { name: /messi/i })
    expect(img).toHaveAttribute('src', '/assets/messi.jpg')
  })

  it('shows em dash when number is missing', () => {
    render(<PlayerCard {...defaults} number={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows em dash when number is null', () => {
    render(<PlayerCard {...defaults} number={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it.each([
    ['Goalkeeper', 'GK'],
    ['Defender', 'DEF'],
    ['Midfielder', 'MID'],
    ['Forward', 'FWD'],
  ])('abbreviates %s → %s', (position, abbr) => {
    render(<PlayerCard {...defaults} position={position} />)
    expect(screen.getByText(abbr)).toBeInTheDocument()
  })

  it('truncates unknown position to 3 chars', () => {
    render(<PlayerCard {...defaults} position="Sweeper" />)
    expect(screen.getByText('SWE')).toBeInTheDocument()
  })

  it('shows em dash for missing position', () => {
    render(<PlayerCard {...defaults} position={undefined} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
