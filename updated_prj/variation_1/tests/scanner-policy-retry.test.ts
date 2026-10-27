import assert from 'node:assert/strict'
import test from 'node:test'

import { buildUrlScanReport } from '../src/lib/scanner/url-report'

const originalFetch = globalThis.fetch
const fullPolicy = `
  Digital Personal Data Protection Act DPDP consent processing purpose.
  Data principal right to access, correction, erasure and withdrawal.
  Retention storage period, encryption, security safeguards and grievance DPO complaint.
  Cookies tracking analytics third-party processor vendor cross-border transfer outside India.
`.repeat(8)

function response(body: string, status = 200): Response {
  return new Response(`<html><body>${body}</body></html>`, {
    status,
    headers: {
      'content-type': 'text/html',
      'strict-transport-security': 'max-age=63072000',
      'content-security-policy': "default-src 'self'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=()',
    },
  })
}

function rootPage(): Response {
  return response(`
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/cookies">Cookies</a>
    <p>We use cookies. Manage cookies or accept all cookies.</p>
  `)
}

test.afterEach(() => {
  globalThis.fetch = originalFetch
})

test('policy fetch retries a transient loading shell', async () => {
  let privacyRequests = 0
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname
    if (path === '/') return rootPage()
    if (path === '/privacy') {
      privacyRequests += 1
      return response(privacyRequests === 1 ? 'Loading privacy policy' : fullPolicy)
    }
    return response(fullPolicy)
  }

  const report = await buildUrlScanReport({ url: 'https://example.test' })
  const privacy = report.policies.find(policy => policy.kind === 'privacy')

  assert.equal(privacyRequests, 2)
  assert.equal(privacy?.found, true)
  assert.ok((privacy?.word_count ?? 0) > 40)
})

test('policy fetch still rejects a permanently thin policy', async () => {
  let privacyRequests = 0
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname
    if (path === '/') return rootPage()
    if (path === '/privacy') {
      privacyRequests += 1
      return response('Short privacy notice')
    }
    return response(fullPolicy)
  }

  const report = await buildUrlScanReport({ url: 'https://example.test' })
  const privacy = report.policies.find(policy => policy.kind === 'privacy')

  assert.equal(privacyRequests, 3)
  assert.equal(privacy?.found, false)
  assert.ok(report.findings.some(finding => finding.id === 'privacy-missing'))
})
