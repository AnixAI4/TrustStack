import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { TRUSTSTACK_ASSURANCE } from '../src/content/truststack-assurance'

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('assurance evidence matches the verified release audit', () => {
  assert.equal(TRUSTSTACK_ASSURANCE.checks.productionHttpsReadiness, 100)
  assert.equal(TRUSTSTACK_ASSURANCE.checks.documentReadiness, 100)
  assert.equal(TRUSTSTACK_ASSURANCE.controls.weakPolicyScore, 18)
  assert.equal(TRUSTSTACK_ASSURANCE.controls.missingPrivacyScore, 92)
  assert.deepEqual(
    TRUSTSTACK_ASSURANCE.policies.map(policy => policy.href),
    ['/privacy', '/terms', '/cookies']
  )
})

test('public page states scope and avoids certification claims', () => {
  const page = source('src/app/assurance/page.tsx')

  assert.match(page, /Release self-assessment passed/)
  assert.match(page, /live recheck pending/i)
  assert.match(page, /not certification by the Data Protection Board/i)
  assert.match(page, /Scope boundary/)
  assert.match(page, /Run your own scan/)
  assert.doesNotMatch(page, /certified compliant|regulator approved|live verified/i)
})

test('assurance page is public and discoverable', () => {
  assert.match(source('src/middleware.ts'), /"\/assurance"/)
  assert.match(source('src/components/site/Footer.tsx'), /href: "\/assurance"/)
})

test('audit still requires every category and finding to pass', () => {
  const audit = source('scripts/audit-scanner-score.mjs')

  assert.match(audit, /category\.score !== 100/)
  assert.match(audit, /report\.overall_score !== 100/)
  assert.match(audit, /assertPerfect\("Production HTTPS readiness"/)
  assert.match(audit, /assertPerfect\("Document readiness"/)
  assert.match(audit, /TRUSTSTACK_ASSURANCE/)
  assert.match(audit, /Public assurance evidence is stale/)
})
