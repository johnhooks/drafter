import { describe, expect, it } from 'vitest'
import { DEFAULT_CAMERA } from '../../src/core/model/types'
import { CANONICAL_VIEWS, angularDistance, lerpView, nearestView, snapTarget, sphericalOf, wrapAzimuth } from '../../src/ui/model/views'

describe('canonical views and snapping', () => {
  it('lists six orthographic and four isometric views', () => {
    expect(CANONICAL_VIEWS).toHaveLength(10)
    expect(CANONICAL_VIEWS.filter((v) => v.id.startsWith('iso'))).toHaveLength(4)
  })
  it('the default camera is the front-left isometric', () => {
    expect(nearestView(DEFAULT_CAMERA).view.id).toBe('iso-fl')
    expect(nearestView(DEFAULT_CAMERA).distance).toBeCloseTo(0, 3)
  })
  it('snaps within 8 degrees and not beyond', () => {
    expect(snapTarget({ azimuth: -85, elevation: 3 })?.id).toBe('front')
    expect(snapTarget({ azimuth: -70, elevation: 15 })).toBeNull()
  })
  it('angular distance is symmetric and zero on itself', () => {
    const a = { azimuth: 30, elevation: 20 }
    const b = { azimuth: -100, elevation: -40 }
    expect(angularDistance(a, a)).toBeCloseTo(0)
    expect(angularDistance(a, b)).toBeCloseTo(angularDistance(b, a))
    expect(angularDistance({ azimuth: 0, elevation: 0 }, { azimuth: 90, elevation: 0 })).toBeCloseTo(90)
  })
  it('wraps azimuth and interpolates the short way', () => {
    expect(wrapAzimuth(190)).toBe(-170)
    expect(wrapAzimuth(-180)).toBe(180)
    const mid = lerpView({ ...DEFAULT_CAMERA, azimuth: 170, elevation: 0 }, { azimuth: -170, elevation: 0 }, 0.5)
    expect(mid.azimuth).toBe(180)
  })
  it('recovers spherical state from a position', () => {
    const s = sphericalOf(100, -100, 100 * Math.SQRT2 * Math.tan((35.264 * Math.PI) / 180))
    expect(s.azimuth).toBeCloseTo(-45, 3)
    expect(s.elevation).toBeCloseTo(35.264, 2)
  })
})
