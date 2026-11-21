/**
 * DOM Extractor for 21+ Job Portals
 * Strictly complies with .agent/rules/portal-ext-rule.md (PORTAL-EXT-001).
 *
 * Implements a 4-layer extraction hierarchy:
 * 1. User Selection Fallback (Active text highlight on page)
 * 2. Structured Data (JSON-LD JobPosting schema)
 * 3. Semantic / ARIA Selectors (Targeted portal containers)
 * 4. Clean Visible DOM Text Fallback (Stripped of headers, navbars, footers, scripts)
 */

export interface ExtractedJDResult {
  text: string
  title: string
  company: string
  url: string
  portal: string
  layerUsed: 'selection' | 'json-ld' | 'semantic-selector' | 'visible-dom' | 'none'
  rawLength: number
}

/**
 * Maps hostname to known portal name.
 */
export function detectPortalFromHostname(hostname: string): string {
  const host = hostname.toLowerCase()

  if (host.includes('linkedin.com')) return 'LinkedIn'
  if (host.includes('indeed.com')) return 'Indeed'
  if (host.includes('naukri.com')) return 'Naukri'
  if (host.includes('glassdoor.com')) return 'Glassdoor'
  if (host.includes('foundit.in') || host.includes('foundit.com') || host.includes('monsterindia.com')) return 'Foundit'
  if (host.includes('internshala.com')) return 'Internshala'
  if (host.includes('instahyre.com')) return 'Instahyre'
  if (host.includes('hirist.com') || host.includes('hirist.tech')) return 'Hirist'
  if (host.includes('cutshort.io')) return 'Cutshort'
  if (host.includes('wellfound.com') || host.includes('angel.co')) return 'Wellfound'
  if (host.includes('workatastartup.com') || (host.includes('ycombinator.com') && host.includes('job'))) return 'YC Work at a Startup'
  if (host.includes('greenhouse.io')) return 'Greenhouse'
  if (host.includes('lever.co')) return 'Lever'
  if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) return 'Workday'
  if (host.includes('smartrecruiters.com')) return 'SmartRecruiters'
  if (host.includes('ashbyhq.com')) return 'Ashby'
  if (host.includes('bamboohr.com')) return 'BambooHR'
  if (host.includes('taleo.net')) return 'Taleo'
  if (host.includes('icims.com')) return 'iCIMS'
  if (host.includes('dice.com')) return 'Dice'
  if (host.includes('ziprecruiter.com')) return 'ZipRecruiter'
  if (host.includes('simplyhired.com')) return 'SimplyHired'
  if (host.includes('careerbuilder.com')) return 'CareerBuilder'
  if (host.includes('careers.google.com')) return 'Google Careers'

  return host.replace(/^www\./, '')
}

/**
 * Self-contained extraction function injected into the active webpage context.
 * MUST NOT depend on outer closure variables or external imports.
 */
export function extractJobDescriptionFromPage(): ExtractedJDResult {
  const url = window.location.href
  const hostname = window.location.hostname.toLowerCase()

  // Helper: Strip HTML tags cleanly
  function stripHtml(html: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
  }

  // Detect portal name
  let portal = hostname.replace(/^www\./, '')
  if (hostname.includes('linkedin.com')) portal = 'LinkedIn'
  else if (hostname.includes('indeed.com')) portal = 'Indeed'
  else if (hostname.includes('naukri.com')) portal = 'Naukri'
  else if (hostname.includes('glassdoor.com')) portal = 'Glassdoor'
  else if (hostname.includes('foundit.in') || hostname.includes('foundit.com') || hostname.includes('monsterindia.com')) portal = 'Foundit'
  else if (hostname.includes('internshala.com')) portal = 'Internshala'
  else if (hostname.includes('instahyre.com')) portal = 'Instahyre'
  else if (hostname.includes('hirist.com') || hostname.includes('hirist.tech')) portal = 'Hirist'
  else if (hostname.includes('cutshort.io')) portal = 'Cutshort'
  else if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) portal = 'Wellfound'
  else if (hostname.includes('workatastartup.com')) portal = 'YC Work at a Startup'
  else if (hostname.includes('greenhouse.io')) portal = 'Greenhouse'
  else if (hostname.includes('lever.co')) portal = 'Lever'
  else if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com')) portal = 'Workday'
  else if (hostname.includes('smartrecruiters.com')) portal = 'SmartRecruiters'
  else if (hostname.includes('ashbyhq.com')) portal = 'Ashby'
  else if (hostname.includes('bamboohr.com')) portal = 'BambooHR'
  else if (hostname.includes('dice.com')) portal = 'Dice'
  else if (hostname.includes('ziprecruiter.com')) portal = 'ZipRecruiter'
  else if (hostname.includes('simplyhired.com')) portal = 'SimplyHired'
  else if (hostname.includes('careerbuilder.com')) portal = 'CareerBuilder'
  else if (hostname.includes('careers.google.com')) portal = 'Google Careers'

  // ----------------------------------------------------
  // Layer 4 / Priority: User Highlighted Text Selection
  // ----------------------------------------------------
  const userSelection = window.getSelection()?.toString().trim() || ''
  if (userSelection.length >= 50) {
    return {
      text: userSelection,
      title: document.title || 'Selected Job Description',
      company: '',
      url,
      portal,
      layerUsed: 'selection',
      rawLength: userSelection.length,
    }
  }

  // ----------------------------------------------------
  // Layer 1: JSON-LD Structured Data (@type: "JobPosting")
  // ----------------------------------------------------
  try {
    const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    for (const script of jsonLdScripts) {
      const rawContent = script.textContent?.trim()
      if (!rawContent) continue

      let parsed: any
      try {
        parsed = JSON.parse(rawContent)
      } catch {
        continue
      }

      const items = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed]

      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const itemType = item['@type']
        const isJob = typeof itemType === 'string'
          ? itemType.toLowerCase() === 'jobposting'
          : Array.isArray(itemType) && itemType.some((t: any) => String(t).toLowerCase() === 'jobposting')

        if (isJob) {
          const title = String(item.title || item.name || '').trim()
          let company = ''
          if (typeof item.hiringOrganization === 'string') {
            company = item.hiringOrganization
          } else if (item.hiringOrganization && typeof item.hiringOrganization.name === 'string') {
            company = item.hiringOrganization.name
          }

          const descRaw = item.description || ''
          const cleanDesc = stripHtml(descRaw)

          const skills = Array.isArray(item.skills)
            ? item.skills.join(', ')
            : (typeof item.skills === 'string' ? item.skills : '')

          const qualifications = Array.isArray(item.qualifications)
            ? item.qualifications.join('\n')
            : (typeof item.qualifications === 'string' ? stripHtml(item.qualifications) : '')

          const assembledParts = [
            title ? `Role Title: ${title}` : '',
            company ? `Company: ${company}` : '',
            cleanDesc,
            skills ? `Required Skills: ${skills}` : '',
            qualifications ? `Qualifications: ${qualifications}` : '',
          ].filter(Boolean)

          const combinedText = assembledParts.join('\n\n')
          if (combinedText.length >= 80) {
            return {
              text: combinedText.slice(0, 12000),
              title,
              company,
              url,
              portal,
              layerUsed: 'json-ld',
              rawLength: combinedText.length,
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('ResummeBuilder: JSON-LD parse error', err)
  }

  // ----------------------------------------------------
  // Layer 2: Semantic & Targeted Portal Selectors
  // ----------------------------------------------------
  const targetedSelectors = [
    // Workday
    '[data-automation-id="jobPostingDescription"]',
    '[data-automation-id="job-description"]',
    // Indeed
    '#jobDescriptionText',
    '[data-testid="jobDescriptionText"]',
    '[data-testid="job-details"]',
    // LinkedIn
    '#job-details',
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.description__text',
    // Naukri
    '.job-desc-section',
    '.styles_job_desc__* [class*="job-desc"]',
    '.styles_JDC__dang-inner-html',
    '.job-description',
    // Foundit
    '.job-details',
    '.jd-container',
    '.jd-text',
    // Greenhouse
    '#content .body',
    '#app #content',
    '#content',
    // Lever
    'section.section-wrapper',
    '.posting-requirements',
    '.posting-headline',
    // Ashby
    '[data-testid="job-posting-body"]',
    '.ashby-job-posting-description',
    // SmartRecruiters
    '.job-detail',
    'section[itemprop="description"]',
    // Generic Semantics
    'main article',
    'article[role="main"]',
    'main',
    'article',
    '[role="main"]',
  ]

  for (const selector of targetedSelectors) {
    try {
      const el = document.querySelector(selector)
      if (el) {
        // Clone and strip noisy children
        const clone = el.cloneNode(true) as HTMLElement
        const noisy = clone.querySelectorAll(
          'script, style, noscript, svg, nav, header, footer, aside, button, form, iframe, [aria-hidden="true"]'
        )
        noisy.forEach(node => node.remove())

        const text = (clone.innerText || clone.textContent || '')
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

        if (text.length >= 80) {
          // Attempt basic title/company heuristic
          const pageTitle = document.title || ''
          return {
            text: text.slice(0, 12000),
            title: pageTitle,
            company: '',
            url,
            portal,
            layerUsed: 'semantic-selector',
            rawLength: text.length,
          }
        }
      }
    } catch {
      // Selector syntax or access issue, continue
    }
  }

  // ----------------------------------------------------
  // Layer 3: Clean Visible DOM Text Fallback
  // ----------------------------------------------------
  try {
    const bodyClone = document.body.cloneNode(true) as HTMLElement
    const noiseSelectors = [
      'script',
      'style',
      'noscript',
      'svg',
      'header',
      'nav',
      'footer',
      'aside',
      'iframe',
      '.cookie-banner',
      '#cookie-notice',
      '[role="banner"]',
      '[role="navigation"]',
      '[role="contentinfo"]',
      'button',
      'form',
    ]

    noiseSelectors.forEach(sel => {
      bodyClone.querySelectorAll(sel).forEach(el => el.remove())
    })

    const bodyText = (bodyClone.innerText || bodyClone.textContent || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (bodyText.length >= 50) {
      return {
        text: bodyText.slice(0, 12000),
        title: document.title || '',
        company: '',
        url,
        portal,
        layerUsed: 'visible-dom',
        rawLength: bodyText.length,
      }
    }
  } catch (err) {
    console.warn('ResummeBuilder: DOM fallback failed', err)
  }

  // Empty fallback if nothing could be cleanly extracted
  return {
    text: '',
    title: document.title || '',
    company: '',
    url,
    portal,
    layerUsed: 'none',
    rawLength: 0,
  }
}

/**
 * Executes DOM extraction in the active tab with dynamic content retry (WC-4).
 * If the first extraction returns text shorter than 50 chars, waits 1200ms and retries once.
 */
export async function extractWithRetry(tabId: number): Promise<ExtractedJDResult> {
  const runScript = async (): Promise<ExtractedJDResult> => {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractJobDescriptionFromPage,
    })

    if (!results || results.length === 0 || !results[0].result) {
      throw new Error('Failed to execute extraction script in the active tab.')
    }

    return results[0].result as ExtractedJDResult
  }

  const initial = await runScript()

  // WC-4: If content hasn't rendered yet (e.g., client-side hydration / dynamic fetch)
  if (initial.text.trim().length < 50) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    const retried = await runScript()
    if (retried.text.trim().length >= 50) {
      return retried
    }
  }

  return initial
}
