import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { generateGaps } from '../src/lib/platform/ai/gap-generator'
import { signShareToken, verifyShareToken } from '../src/lib/platform/dashboard/share-token'
import {
  signQuestionnaireToken,
  verifyQuestionnaireToken,
} from '../src/lib/platform/vendors/token'

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('signed board-report tokens bind the report to one assessment owner', () => {
  const previousSecret = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'assessment-isolation-test-secret'

  try {
    const token = signShareToken(
      'org-a',
      'user-a',
      '2026-07-01T00:00:00.000Z',
      '2026-07-31T23:59:59.000Z',
      60_000
    )
    const payload = verifyShareToken(token)

    assert.ok(payload)
    assert.equal(payload.o, 'org-a')
    assert.equal(payload.u, 'user-a')
  } finally {
    if (previousSecret === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousSecret
  }
})

test('all direct assessment reads and writes require the authenticated creator', () => {
  const files = [
    'src/app/api/trustdeck/assessment/save-answer/route.ts',
    'src/app/api/trustdeck/assessment/submit/route.ts',
    'src/app/api/trustdeck/assessment/results/[id]/route.ts',
    'src/app/trustdeck/(app)/assessment/page.tsx',
    'src/app/trustdeck/(app)/assessment/results/[id]/page.tsx',
    'src/app/api/trustdeck/dashboard/compass-score/route.ts',
  ]

  for (const file of files) {
    assert.match(source(file), /\.eq\('created_by', user\.id\)/, file)
  }
})

test('dashboard and reports carry the assessment owner through every aggregate', () => {
  assert.match(source('src/lib/platform/dashboard/aggregate.ts'), /\.eq\('created_by', assessmentOwnerId\)/)
  assert.match(source('src/app/api/trustdeck/dashboard/overview/route.ts'), /ctx\.org\.name, user\.id/)
  assert.match(source('src/app/api/trustdeck/dashboard/report/generate/route.ts'), /toDate,\s*user\.id/)
  assert.match(source('src/app/api/trustdeck/dashboard/report/share/route.ts'), /ctx\.organizationId, user\.id/)
  assert.match(source('src/app/trustdeck/public/board-report/[token]/page.tsx'), /payload\.u/)
})

test('protected platform APIs enforce active Pilot entitlement centrally', () => {
  const orgSource = source('src/lib/platform/org.ts')

  assert.match(orgSource, /hasPilotAccess/)
  assert.match(orgSource, /Pilot subscription required/)
  assert.match(orgSource, /status: 402/)

  for (const file of [
    'src/app/api/trustdeck/organizations/invites/route.ts',
    'src/app/api/trustdeck/organizations/members/[userId]/route.ts',
  ]) {
    assert.match(source(file), /requirePlatformOrg/, file)
  }

  const middleware = source('src/middleware.ts')
  assert.match(middleware, /trustDeckApi \? null : requiredPilotApiFeature/)
  assert.match(middleware, /\/api\/trustdeck\/breach\/escalations\/run/)
})

test('signed report links use the real route and remain public', () => {
  assert.match(
    source('src/app/api/trustdeck/dashboard/report/share/route.ts'),
    /\/trustdeck\/public\/board-report\//
  )
  assert.match(source('src/middleware.ts'), /"\/trustdeck\/public"/)
})

test('answering no breach on Q38 never creates a false critical notification', () => {
  const noBreach = generateGaps(
    'assessment-a',
    'org-a',
    [{ question_id: 'Q38', answer: 'no' }],
    'it'
  )
  const breachOccurred = generateGaps(
    'assessment-a',
    'org-a',
    [{ question_id: 'Q38', answer: 'yes' }],
    'it'
  )

  assert.deepEqual(noBreach, [])
  assert.equal(breachOccurred.length, 1)
  assert.equal(breachOccurred[0].priority, 'p0')
})

test('the RLS migration replaces organization-wide assessment access', () => {
  const migration = source('supabase/platform/assessment_user_isolation.sql')

  assert.match(migration, /drop policy if exists "org members manage assessments"/)
  assert.match(migration, /created_by = auth\.uid\(\)/)
  assert.match(migration, /assessment_answers\.assessment_id/)
  assert.match(migration, /assessment_gaps\.assessment_id/)
  assert.match(migration, /with check/i)
})

test('public-link signing fails closed without a strong server secret', () => {
  const names = [
    'TRUSTDECK_TOKEN_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
  ] as const
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]))

  try {
    for (const name of names) delete process.env[name]
    process.env.ANTHROPIC_API_KEY = 'not-a-token-signing-key'
    assert.throws(
      () => signShareToken('org-a', 'user-a', 'from', 'to', 60_000),
      /at least 32 bytes/
    )
  } finally {
    delete process.env.ANTHROPIC_API_KEY
    for (const name of names) {
      const value = previous[name]
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})

test('vendor questionnaire tokens reject tampering and expiry', () => {
  const previous = process.env.TRUSTDECK_TOKEN_SECRET
  process.env.TRUSTDECK_TOKEN_SECRET = 'questionnaire-token-test-secret-32-bytes'

  try {
    const token = signQuestionnaireToken('vendor-a', 'org-a', 60_000)
    const [body, signature] = token.split('.')
    const replacement = signature.endsWith('a') ? 'b' : 'a'
    const tampered = `${body}.${signature.slice(0, -1)}${replacement}`

    assert.equal(verifyQuestionnaireToken(tampered), null)
    assert.equal(verifyQuestionnaireToken(signQuestionnaireToken('vendor-a', 'org-a', -1)), null)
    assert.deepEqual(verifyQuestionnaireToken(token)?.v, 'vendor-a')
    assert.deepEqual(verifyQuestionnaireToken(token)?.o, 'org-a')
  } finally {
    if (previous === undefined) delete process.env.TRUSTDECK_TOKEN_SECRET
    else process.env.TRUSTDECK_TOKEN_SECRET = previous
  }
})