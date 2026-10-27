// M5 DSR — prompt builders for the optional Claude-assisted response drafting.
// CLIENT-SAFE (no SDK import), mirroring src/lib/ai/notice-generator.ts so the
// SDK call stays isolated in the API route.
import type { DsrRequest } from '@/types/dpdp'
import { DSR_RIGHT_TYPES } from '@/lib/constants'

export type DsrDraftMode = 'fulfillment' | 'denial'

export const DSR_DRAFT_SYSTEM = `You are a DPDP (India Digital Personal Data Protection Act 2023) compliance assistant helping a Data Protection Officer draft a written reply to a data principal's rights request.

Rules:
- Write in clear, professional, plain English — no legal jargon the data principal won't understand.
- Be concise: 2-4 short paragraphs.
- Do NOT invent facts, dates, or data the DPO hasn't provided. Where a specific detail is needed but missing, insert a clearly marked placeholder like [list the data categories provided].
- Never promise anything beyond what DPDP requires.
- Output ONLY the body of the reply. Do not add a subject line, a greeting beyond "Dear <name>,", or a signature block.`

function rightLabel(rt: string): string {
  return DSR_RIGHT_TYPES.find(r => r.value === rt)?.label ?? rt
}

export function buildDraftUserPrompt(req: DsrRequest, mode: DsrDraftMode): string {
  const right = rightLabel(req.right_type)
  const cats = (req.affected_data_categories ?? []).join(', ') || 'not specified'
  const base = `Request reference: ${req.reference_number}
Right exercised: ${right} (${req.right_type}, DPDP)
Data principal: ${req.requestor_name}
Affected data categories: ${cats}
Request details from the data principal: ${req.request_details || 'not provided'}`

  if (mode === 'denial') {
    return `${base}

Draft a polite reply explaining that this request is being DENIED. Base the rationale ONLY on these internal notes from the DPO: "${req.denial_reason || '[state the specific, lawful reason for denial]'}". Close by informing the data principal that they may escalate to the Data Protection Board of India if they disagree with this decision.`
  }
  return `${base}

Draft a reply confirming the request has been FULFILLED. Summarize the action taken based ONLY on these internal notes from the DPO: "${req.fulfillment_notes || '[summarize the action taken and any data provided]'}". Keep it factual and reassuring.`
}
