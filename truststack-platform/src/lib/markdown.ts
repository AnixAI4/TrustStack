// Dependency-free Markdown → HTML renderer for privacy notices.
// The project has no markdown library (TrustChat hand-rolls its own), and we
// render notice content on a PUBLIC page, so we escape all HTML first and only
// then apply a small, known set of inline/block transforms. This prevents HTML
// injection via free-text fields (e.g. the "Other" data category).

export interface NoticeHeading {
  id: string
  text: string
  level: number
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Inline formatting. Input MUST already be HTML-escaped.
function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#1A1A2E]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs font-mono">$1</code>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      '<a href="$2" class="text-[#2874A6] underline break-words" target="_blank" rel="noopener noreferrer">$1</a>'
    )
}

// Strip headings out for a table of contents. Returns de-duplicated anchor ids
// that match exactly what renderMarkdown() emits.
export function extractHeadings(md: string): NoticeHeading[] {
  const seen = new Map<string, number>()
  const headings: NoticeHeading[] = []
  for (const raw of (md || '').split('\n')) {
    const m = raw.match(/^(#{1,3})\s+(.*)$/)
    if (!m) continue
    const level = m[1].length
    const text = m[2].trim()
    let id = slugify(text) || 'section'
    const n = seen.get(id) ?? 0
    seen.set(id, n + 1)
    if (n > 0) id = `${id}-${n + 1}`
    headings.push({ id, text, level })
  }
  return headings
}

const H_CLASS: Record<number, string> = {
  1: 'text-2xl font-bold text-[#003366] mt-8 mb-3 scroll-mt-24',
  2: 'text-xl font-semibold text-[#003366] mt-7 mb-2 scroll-mt-24',
  3: 'text-base font-semibold text-[#1A1A2E] mt-5 mb-2 scroll-mt-24',
}

// Convert notice Markdown to sanitized, styled HTML. Heading ids are kept in
// sync with extractHeadings() so a table of contents can link to them.
export function renderMarkdown(md: string): string {
  const seen = new Map<string, number>()
  const lines = (md || '').split('\n')
  const out: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }
  const openList = (type: 'ul' | 'ol') => {
    if (listType === type) return
    closeList()
    const cls =
      type === 'ul'
        ? 'list-disc pl-6 mb-3 space-y-1 text-sm text-gray-700'
        : 'list-decimal pl-6 mb-3 space-y-1 text-sm text-gray-700'
    out.push(`<${type} class="${cls}">`)
    listType = type
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')

    if (!line.trim()) {
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      const text = heading[2].trim()
      let id = slugify(text) || 'section'
      const n = seen.get(id) ?? 0
      seen.set(id, n + 1)
      if (n > 0) id = `${id}-${n + 1}`
      out.push(`<h${level} id="${id}" class="${H_CLASS[level]}">${formatInline(escapeHtml(text))}</h${level}>`)
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList()
      out.push('<hr class="my-6 border-gray-200" />')
      continue
    }

    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      openList('ol')
      out.push(`<li class="leading-relaxed">${formatInline(escapeHtml(ol[1]))}</li>`)
      continue
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      openList('ul')
      out.push(`<li class="leading-relaxed">${formatInline(escapeHtml(ul[1]))}</li>`)
      continue
    }

    closeList()
    out.push(`<p class="text-sm text-gray-700 leading-relaxed mb-3">${formatInline(escapeHtml(line))}</p>`)
  }

  closeList()
  return out.join('\n')
}
