import { describe, it, expect } from 'vitest'
import { isValidElement } from 'react'
import { routeAccess } from './routeAccess'
import { navigationConfig, isNavGroup } from './navConfig'
import { LANDING_PATHS } from '@/features/auth/access'
import { router } from '@/routes/appRoutes'

type RouteLike = { path?: string; element?: unknown; children?: RouteLike[] }

function protectedPaths(routes: RouteLike[]): Array<{ path: string; guardPath: string | undefined }> {
  const found: Array<{ path: string; guardPath: string | undefined }> = []
  for (const route of routes) {
    if (route.children) found.push(...protectedPaths(route.children))
    const element = route.element
    if (route.path && isValidElement(element) && (element.props as { path?: string }).path !== undefined) {
      found.push({ path: route.path, guardPath: (element.props as { path?: string }).path })
    }
  }
  return found
}

describe('route access registry', () => {
  const routed = protectedPaths(router.routes as RouteLike[])

  it('finds the protected routes', () => {
    expect(routed.length).toBeGreaterThan(50)
  })

  it('every protected route guards with its own path pattern', () => {
    for (const { path, guardPath } of routed) expect(guardPath).toBe(path)
  })

  it('every protected route is registered', () => {
    const missing = routed.filter(({ path }) => !(path in routeAccess)).map(({ path }) => path)
    expect(missing).toEqual([])
  })

  it('every registered route is actually routed', () => {
    const routedPaths = new Set(routed.map(({ path }) => path))
    const stale = Object.keys(routeAccess).filter((path) => !routedPaths.has(path))
    expect(stale).toEqual([])
  })

  it('every sidebar entry points at a registered route', () => {
    const paths = navigationConfig.flatMap((item) => (isNavGroup(item) ? item.items.map((i) => i.path) : [item.path]))
    const missing = paths.filter((path) => !(path in routeAccess))
    expect(missing).toEqual([])
  })

  it('every role landing page is a registered route', () => {
    for (const path of Object.values(LANDING_PATHS)) expect(routeAccess).toHaveProperty([path])
  })

  it('every landing dashboard is limited to its own role', () => {
    expect(routeAccess['/dashboard/coordinator']).toEqual({ roles: ['Coordinator'] })
    expect(routeAccess['/dashboard/office-assistant']).toEqual({ roles: ['OfficeAssistant'] })
  })

  it('does not keep the removed admissions route', () => {
    expect(routeAccess).not.toHaveProperty(['/apply'])
    expect(routed.some(({ path }) => path === '/apply')).toBe(false)
  })

  it('serves the transcript verification page outside the authenticated layout', () => {
    const top = (router.routes as RouteLike[]).map((r) => r.path)
    expect(top).toContain('/verify/:token')
    expect(routed.some(({ path }) => path === '/verify/:token')).toBe(false)
  })

  it('unknown protected URLs render Not Found instead of redirecting', () => {
    const layout = (router.routes as RouteLike[]).find((r) => r.children)
    const catchAll = layout?.children?.find((r) => r.path === '*')
    expect(catchAll).toBeDefined()
    expect(routeAccess['*']).toEqual({})
  })
})
