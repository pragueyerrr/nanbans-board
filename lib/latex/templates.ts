import type { ResumeData } from '@/types'

/**
 * Generates a professional one-page LaTeX resume.
 * Uses moderncv-inspired clean layout with adjustable font size.
 * Compile with: pdflatex resume.tex  (or upload to Overleaf)
 */
export function generateLatexResume(data: ResumeData): string {
  const pt = data.fontSizePt
  const marginV = data.compact ? '0.5in' : '0.6in'
  const marginH = data.compact ? '0.55in' : '0.65in'
  const sectionSpacing = data.compact ? '0pt' : '2pt'
  const itemSep = data.compact ? '-4pt' : '-2pt'
  const maxBulletsPerJob = data.compact ? 2 : 4

  const esc = (s: string) =>
    (s ?? '')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/\^/g, '\\^{}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/</g, '\\textless{}')
      .replace(/>/g, '\\textgreater{}')

  // ── Header ──────────────────────────────────────────────────────────────
  const contactParts: string[] = []
  if (data.phone) contactParts.push(esc(data.phone))
  if (data.email) contactParts.push(`\\href{mailto:${data.email}}{${esc(data.email)}}`)
  if (data.linkedin) contactParts.push(`\\href{https://${data.linkedin.replace(/^https?:\/\//, '')}}{LinkedIn}`)
  if (data.portfolio || data.website) {
    const url = (data.portfolio || data.website)!.replace(/^https?:\/\//, '')
    contactParts.push(`\\href{https://${url}}{Portfolio}`)
  }
  if (data.location) contactParts.push(esc(data.location))
  const contactLine = contactParts.join(' $\\cdot$ ')

  // ── Skills ───────────────────────────────────────────────────────────────
  const skillsLines = data.skills
    .map((g) => `\\textbf{${esc(g.category)}:} ${g.items.map(esc).join(', ')}`)
    .join(' \\\\\n    ')

  // ── Experience ────────────────────────────────────────────────────────────
  const expItems = data.experiences
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((exp) => {
      const bullets = exp.bullets
        .slice(0, maxBulletsPerJob)
        .map((b) => `      \\item ${esc(b)}`)
        .join('\n')
      return `
  \\subsection*{${esc(exp.title)} \\hfill \\normalfont\\small ${esc(exp.period)}}
  \\vspace{-4pt}
  {\\itshape ${esc(exp.company)}${exp.location ? ` -- ${esc(exp.location)}` : ''}}
  \\vspace{2pt}
  \\begin{itemize}[leftmargin=*, nosep, itemsep=${itemSep}]
${bullets}
  \\end{itemize}`
    })
    .join('\n  \\vspace{${sectionSpacing}}\n')

  // ── Education ─────────────────────────────────────────────────────────────
  const eduItems = data.education
    .map(
      (edu) => `
  \\textbf{${esc(edu.degree)}} \\hfill ${edu.year ? esc(edu.year) : ''} \\\\
  ${esc(edu.institution)}${edu.location ? `, ${esc(edu.location)}` : ''}`
    )
    .join('\n  \\vspace{2pt}\n')

  // ── Certifications ────────────────────────────────────────────────────────
  const certsSection =
    data.certifications && data.certifications.length > 0
      ? `
\\section*{Certifications}
\\vspace{-6pt}\\rule{\\linewidth}{0.4pt}\\vspace{4pt}

${data.certifications.map(esc).join(' $\\cdot$ ')}`
      : ''

  return `\\documentclass[${pt}pt,a4paper]{article}

% ─── Packages ─────────────────────────────────────────────────────────────────
\\usepackage[margin=${marginV}, left=${marginH}, right=${marginH}]{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome5}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{microtype}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{parskip}
\\usepackage{xcolor}

% ─── Hyperlink styling ────────────────────────────────────────────────────────
\\hypersetup{
  colorlinks=true,
  urlcolor=black,
  linkcolor=black,
}

% ─── Section formatting ───────────────────────────────────────────────────────
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\vspace{-8pt}\\rule{\\linewidth}{0.4pt}]
\\titlespacing{\\section}{0pt}{10pt}{4pt}
\\titleformat{\\subsection}{\\normalsize\\bfseries}{}{0em}{}
\\titlespacing{\\subsection}{0pt}{6pt}{1pt}

% ─── List settings ────────────────────────────────────────────────────────────
\\setlist[itemize]{leftmargin=1.2em, itemsep=${itemSep}, parsep=0pt, topsep=0pt}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}

\\begin{document}

% ─── Header ───────────────────────────────────────────────────────────────────
\\begin{center}
  {\\Huge\\bfseries ${esc(data.name)}}\\\\[4pt]
  {\\small ${contactLine}}
\\end{center}

\\vspace{4pt}

% ─── Summary ──────────────────────────────────────────────────────────────────
\\section*{Professional Summary}

${esc(data.summary)}

% ─── Skills ───────────────────────────────────────────────────────────────────
\\section*{Skills}

{\\small
  ${skillsLines}
}

% ─── Experience ───────────────────────────────────────────────────────────────
\\section*{Experience}
${expItems}

% ─── Education ────────────────────────────────────────────────────────────────
\\section*{Education}
\\vspace{4pt}
${eduItems}
${certsSection}

\\end{document}
`
}
