import { expect, it, vi } from 'vitest'
import { addSheet, initialState } from '../../src/ui/store/actions'
import { exportSheet } from '../../src/ui/sheets/output'
import { downloadText } from '../../src/ui/exportFile'

vi.mock('../../src/ui/sheets/isoRender', () => ({ cachedIsometric: () => undefined, renderIsometric: async () => 'data:image/png;base64,pixels' }))
vi.mock('../../src/ui/exportFile', () => ({ downloadText: vi.fn(), safeName: (name: string) => name }))

it('waits for the raster before downloading a standalone isometric SVG', async () => {
  await exportSheet(addSheet(initialState(), 'iso', 'isometric'))
  expect(downloadText).toHaveBeenCalledWith('Untitled-Sheet 1.svg', expect.stringContaining('href="data:image/png;base64,pixels"'), 'image/svg+xml')
})
