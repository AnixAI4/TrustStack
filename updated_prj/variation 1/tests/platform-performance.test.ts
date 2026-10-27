import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('middleware verifies claims without an unconditional user lookup', () => {
  const auth = source('src/lib/supabase/middleware.ts')

  assert.match(auth, /supabase\.auth\.getClaims\(\)/)
  assert.doesNotMatch(auth, /supabase\.auth\.getUser\(\)/)
})

test('TrustDeck avoids duplicate middleware Pilot resolution', () => {
  const middleware = source('src/middleware.ts')
  const invites = source('src/app/api/trustdeck/organizations/invites/route.ts')
  const members = source('src/app/api/trustdeck/organizations/members/[userId]/route.ts')

  assert.match(middleware, /trustDeckApi \? null : requiredPilotApiFeature/)
  assert.match(invites, /requirePlatformOrg/)
  assert.match(members, /requirePlatformOrg/)
})

test('high-traffic TrustDeck reads use the verified-user helper', () => {
  const files = [
    'src/app/trustdeck/(app)/layout.tsx',
    'src/app/api/trustdeck/dashboard/overview/route.ts',
    'src/app/api/trustdeck/organizations/me/route.ts',
    'src/app/api/trustdeck/dsr/requests/route.ts',
    'src/app/api/trustdeck/dsr/stats/route.ts',
    'src/app/api/trustdeck/consent/stats/route.ts',
    'src/app/api/trustdeck/breach/route.ts',
    'src/app/api/trustdeck/breach/stats/route.ts',
    'src/app/api/trustdeck/ropa/route.ts',
    'src/app/api/trustdeck/ropa/stats/route.ts',
    'src/app/api/trustdeck/vendors/route.ts',
    'src/app/api/trustdeck/vendors/stats/route.ts',
  ]

  for (const file of files) {
    assert.match(source(file), /getVerifiedUser/, file)
  }
})

test('organization data is reused from the server layout', () => {
  const layout = source('src/app/trustdeck/(app)/layout.tsx')
  assert.match(layout, /PlatformOrgProvider org=\{ctx\.org\}/)

  for (const file of [
    'src/app/trustdeck/(app)/assessment/[id]/page.tsx',
    'src/app/trustdeck/(app)/dsr/page.tsx',
    'src/app/trustdeck/(app)/grievance/page.tsx',
    'src/app/trustdeck/(app)/privacy-notice/page.tsx',
  ]) {
    const page = source(file)
    assert.match(page, /usePlatformOrg\(\)/, file)
    assert.doesNotMatch(page, /\/api\/trustdeck\/organizations\/me/, file)
  }
})

test('Overview uses an account-scoped short-lived memory cache', () => {
  const overview = source('src/app/trustdeck/(app)/overview/page.tsx')

  assert.match(overview, /OVERVIEW_CACHE_TTL_MS = 10_000/)
  assert.match(overview, /overviewCache\?\.userId === userId/)
  assert.match(overview, /setData\(overviewCache\.data\)/)
})

test('TrustChat code loads only after user interaction', () => {
  const launcher = source('src/components/site/LexBotLauncher.tsx')
  const siteFrame = source('src/components/site/SiteFrame.tsx')
  const platformChrome = source('src/components/platform/dashboard/PlatformChrome.tsx')

  assert.match(launcher, /await import\("\.\/LexBot"\)/)
  assert.doesNotMatch(siteFrame, /dynamic\(\(\) => import\("\.\/LexBot"\)/)
  assert.match(siteFrame, /<LexBotLauncher \/>/)
  assert.match(platformChrome, /<LexBotLauncher platform \/>/)
})

test('navigation prefetches on intent and module polling pauses when hidden', () => {
  const chrome = source('src/components/platform/dashboard/PlatformChrome.tsx')
  const mobile = source('src/components/platform/dashboard/PlatformMobileNav.tsx')

  assert.match(chrome, /router\.prefetch\(mod\.href\)/)
  assert.match(mobile, /router\.prefetch\(mod\.href\)/)

  for (const file of [
    'src/app/trustdeck/(app)/breach/page.tsx',
    'src/app/trustdeck/(app)/dsr/page.tsx',
    'src/app/trustdeck/(app)/grievance/page.tsx',
    'src/app/trustdeck/(app)/ropa/page.tsx',
    'src/app/trustdeck/(app)/vendors/page.tsx',
  ]) {
    assert.match(source(file), /document\.visibilityState === 'visible'/, file)
  }
})
