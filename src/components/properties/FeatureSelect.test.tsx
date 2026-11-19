import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import { FeatureSelect } from './FeatureSelect'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const catalog = [
  { _id: 'feature-garden', name: 'Garden' },
  { _id: 'feature-garage', name: 'Garage' },
  { _id: 'feature-pool', name: 'Swimming pool' },
]

const getFeatures = vi.mocked(api.get)
const postFeature = vi.mocked(api.post)

beforeEach(() => {
  vi.clearAllMocks()
  getFeatures.mockResolvedValue({ data: catalog } as never)
})

describe('FeatureSelect', () => {
  it('shows loading feedback and loads searchable multi-select options', async () => {
    let finishLoad!: (value: { data: typeof catalog }) => void
    getFeatures.mockReturnValueOnce(new Promise((resolve) => { finishLoad = resolve }) as never)
    const onChange = vi.fn()
    render(<FeatureSelect value={[]} onChange={onChange} />)

    expect(screen.getByText(/loading features/i)).toBeInTheDocument()
    finishLoad({ data: catalog })

    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await userEvent.type(search, 'gara')
    const listbox = screen.getByRole('listbox', { name: /available features/i })
    expect(within(listbox).getByRole('option', { name: 'Garage' })).toBeInTheDocument()
    expect(within(listbox).queryByRole('option', { name: 'Garden' })).not.toBeInTheDocument()

    await userEvent.click(within(listbox).getByRole('option', { name: 'Garage' }))
    expect(onChange).toHaveBeenCalledWith(['Garage'])
  })

  it('keeps removed legacy snapshots available for reselection without creating a catalog feature', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<FeatureSelect value={['Garden', 'Legacy fireplace']} onChange={onChange} />)
    const listbox = await screen.findByRole('listbox', { name: /available features/i })

    const selected = screen.getByRole('list', { name: /selected features/i })
    await userEvent.click(within(selected).getByRole('button', { name: /remove legacy fireplace/i }))
    expect(onChange).toHaveBeenCalledWith(['Garden'])

    rerender(<FeatureSelect value={['Garden']} onChange={onChange} />)
    const legacyOption = within(listbox).getByRole('option', { name: 'Legacy fireplace' })
    expect(legacyOption).toHaveAttribute('aria-selected', 'false')
    await userEvent.click(legacyOption)

    expect(onChange).toHaveBeenLastCalledWith(['Garden', 'Legacy fireplace'])
    expect(postFeature).not.toHaveBeenCalled()
  })

  it('normalizes a newly created feature before sending it and selects the saved result', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    postFeature.mockResolvedValueOnce({ data: { _id: 'feature-trees', name: 'Mature trees' } } as never)
    render(<FeatureSelect value={[]} onChange={onChange} />)
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, '  Mature   trees  ')
    await user.click(screen.getByRole('button', { name: /add feature: mature trees/i }))

    await waitFor(() => expect(postFeature).toHaveBeenCalledWith('/features', { name: 'Mature trees' }))
    expect(onChange).toHaveBeenCalledWith(['Mature trees'])
    expect(search).toHaveValue('')
  })

  it('reuses a case-and-whitespace duplicate from the catalog instead of posting it again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FeatureSelect value={[]} onChange={onChange} />)
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, '  gArDeN  ')
    const listbox = screen.getByRole('listbox', { name: /available features/i })
    await user.click(within(listbox).getByRole('option', { name: 'Garden' }))

    expect(onChange).toHaveBeenCalledWith(['Garden'])
    expect(screen.queryByRole('button', { name: /add feature: garden/i })).not.toBeInTheDocument()
    expect(postFeature).not.toHaveBeenCalled()
  })

  it('locks the current selection while a delayed create is in flight', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    let finishCreate!: (response: { data: { _id: string; name: string } }) => void
    postFeature.mockReturnValueOnce(new Promise((resolve) => { finishCreate = resolve }) as never)
    render(<FeatureSelect value={['Garden']} onChange={onChange} />)
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, 'gar')
    const listbox = screen.getByRole('listbox', { name: /available features/i })
    await user.click(screen.getByRole('button', { name: /add feature: gar/i }))

    expect(screen.getByRole('button', { name: /saving feature/i })).toBeDisabled()
    expect(search).toBeDisabled()
    expect(within(listbox).getByRole('option', { name: 'Garage' })).toBeDisabled()
    const selected = screen.getByRole('list', { name: /selected features/i })
    const removeGarden = within(selected).getByRole('button', { name: /remove garden/i })
    expect(removeGarden).toBeDisabled()
    await user.click(removeGarden)
    expect(onChange).not.toHaveBeenCalled()

    finishCreate({ data: { _id: 'feature-gar', name: 'gar' } })
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['Garden', 'gar']))
  })

  it('ignores a delayed create completion after the editor unmounts', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onBusyChange = vi.fn()
    let finishCreate!: (response: { data: { _id: string; name: string } }) => void
    postFeature.mockReturnValueOnce(new Promise((resolve) => { finishCreate = resolve }) as never)
    const { unmount } = render(<FeatureSelect value={[]} onChange={onChange} onBusyChange={onBusyChange} />)
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, 'Late feature')
    await user.click(screen.getByRole('button', { name: /add feature: late feature/i }))

    unmount()
    await act(async () => {
      finishCreate({ data: { _id: 'feature-late', name: 'Late feature' } })
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(onBusyChange).toHaveBeenCalledTimes(1)
    expect(onBusyChange).toHaveBeenCalledWith(true)
  })

  it('retains the typed value and reports create failures', async () => {
    const user = userEvent.setup()
    postFeature.mockRejectedValueOnce(new Error('network failure'))
    render(<FeatureSelect value={[]} onChange={vi.fn()} />)
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, 'Garden sauna')
    await user.click(screen.getByRole('button', { name: /add feature: garden sauna/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save feature/i)
    expect(search).toHaveValue('Garden sauna')
  })

  it('offers retry after a catalog load error without dropping the search input', async () => {
    const user = userEvent.setup()
    getFeatures.mockRejectedValueOnce(new Error('network failure'))
    render(<FeatureSelect value={[]} onChange={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load features/i)

    const search = screen.getByRole('searchbox', { name: /search or add a feature/i })
    await user.type(search, 'A feature I am still entering')
    await user.click(screen.getByRole('button', { name: /retry loading features/i }))
    await screen.findByRole('listbox', { name: /available features/i })
    expect(search).toHaveValue('A feature I am still entering')
    expect(getFeatures).toHaveBeenCalledTimes(2)
  })

  it('enforces the 100 Unicode-code-point feature-name limit', async () => {
    const user = userEvent.setup()
    render(<FeatureSelect value={[]} onChange={vi.fn()} />)
    const search = await screen.findByRole('searchbox', { name: /search or add a feature/i })
    const tooLong = '🏡'.repeat(101)
    fireEvent.change(search, { target: { value: tooLong } })
    await user.click(screen.getByRole('button', { name: /add feature/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/100 characters or fewer/i)
    expect(postFeature).not.toHaveBeenCalled()
    expect(search).toHaveValue(tooLong)
  })
})
