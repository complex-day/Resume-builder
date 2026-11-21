import { useState, useEffect } from 'react'
import {
  extractWithRetry,
  detectPortalFromHostname,
  ExtractedJDResult,
} from './utils/domExtractor'
import {
  getSettings,
  saveSettings,
  fetchUserVault,
  runResumePipeline,
  generateAndDownloadPDF,
  PipelineRunResponse,
  ExtensionSettings,
} from './utils/api'

type AppState = 'idle' | 'extracting' | 'decoding' | 'architecting' | 'critiquing' | 'generating_pdf' | 'completed' | 'error'

export default function App() {
  // Settings
  const [settings, setSettings] = useState<ExtensionSettings>({
    backendUrl: 'http://localhost:8000',
    userId: 'test-user',
  })
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [vaultStatus, setVaultStatus] = useState<string | null>(null)
  const [isCheckingVault, setIsCheckingVault] = useState<boolean>(false)

  // Page / Extraction state
  const [portal, setPortal] = useState<string>('Detecting...')
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [extractedLayer, setExtractedLayer] = useState<string>('')
  const [jdText, setJdText] = useState<string>('')

  // Pipeline state
  const [appState, setAppState] = useState<AppState>('idle')
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Result state
  const [pipelineResult, setPipelineResult] = useState<PipelineRunResponse | null>(null)
  const [loadedVault, setLoadedVault] = useState<any>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false)

  // Initialize: Load settings and extract JD on popup open
  useEffect(() => {
    async function init() {
      try {
        const saved = await getSettings()
        setSettings(saved)
        await triggerExtraction()
      } catch (err: any) {
        console.error('Init error:', err)
      }
    }
    init()
  }, [])

  // Trigger activeTab DOM extraction
  const triggerExtraction = async () => {
    setAppState('extracting')
    setProgressMsg('Scanning active tab for job description...')
    setErrorMessage(null)

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      // Dev / preview mode outside Chrome
      setPortal('Local Preview')
      setSourceUrl('http://localhost:3000/sample-job')
      setExtractedLayer('preview')
      setAppState('idle')
      return
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const activeTab = tabs[0]

      if (!activeTab || !activeTab.id || !activeTab.url) {
        setAppState('idle')
        setPortal('Unknown Page')
        return
      }

      setSourceUrl(activeTab.url)
      const detected = activeTab.url.startsWith('http')
        ? detectPortalFromHostname(new URL(activeTab.url).hostname)
        : 'Browser Tab'
      setPortal(detected)

      // Only attempt injection on HTTP/HTTPS pages
      if (!activeTab.url.startsWith('http://') && !activeTab.url.startsWith('https://')) {
        setAppState('idle')
        return
      }

      const result: ExtractedJDResult = await extractWithRetry(activeTab.id)
      if (result.portal) setPortal(result.portal)
      if (result.layerUsed) setExtractedLayer(result.layerUsed)

      if (result.text && result.text.trim().length >= 50) {
        setJdText(result.text.trim())
      }
    } catch (err: any) {
      console.warn('Extraction notice:', err)
      // Non-fatal: user can paste manually
    } finally {
      setAppState('idle')
    }
  }

  // Test Vault Connection
  const handleTestVault = async () => {
    setIsCheckingVault(true)
    setVaultStatus(null)
    try {
      const vault = await fetchUserVault(settings.backendUrl, settings.userId)
      const projCount = vault.projects?.length || 0
      const skillCount = vault.skills?.reduce((sum: number, c: any) => sum + (c.skills?.length || 0), 0) || 0
      setVaultStatus(`Connected: ${vault.basics?.full_name || settings.userId} (${projCount} projects, ${skillCount} skills)`)
      setLoadedVault(vault)
    } catch (err: any) {
      setVaultStatus(`Error: ${err.message}`)
    } finally {
      setIsCheckingVault(false)
    }
  }

  // Save Settings
  const handleSaveSettings = async () => {
    await saveSettings(settings)
    await handleTestVault()
    setShowSettings(false)
  }

  // Run 3-Agent Pipeline and PDF Generation
  const handleGenerateResume = async () => {
    if (!jdText || jdText.trim().length < 50) {
      setErrorMessage('Please provide a job description of at least 50 characters.')
      return
    }

    setErrorMessage(null)
    setAppState('decoding')
    setProgressMsg('Agent 1 (JD Decoder): Extracting core skills & constraints...')

    try {
      // 1. Fetch user vault first to ensure we have it for PDF generation
      let userVault = loadedVault
      if (!userVault) {
        setProgressMsg('Loading Master Truth Vault...')
        userVault = await fetchUserVault(settings.backendUrl, settings.userId)
        setLoadedVault(userVault)
      }

      // 2. Run LangGraph Multi-Agent Pipeline
      setProgressMsg('Agents 1 & 2: Synthesizing tailored STAR bullets & matching projects...')
      const runResponse = await runResumePipeline(
        settings.backendUrl,
        settings.userId,
        jdText.trim(),
        sourceUrl || undefined
      )

      setPipelineResult(runResponse)
      setAppState('completed')
    } catch (err: any) {
      console.error('Pipeline error:', err)
      setErrorMessage(err.message || 'An error occurred during resume tailoring.')
      setAppState('error')
    }
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!pipelineResult || !loadedVault) return
    setIsDownloadingPdf(true)
    try {
      const targetRoleClean = (pipelineResult.tailored_resume.target_role || 'Tailored_Resume')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
      const filename = `${loadedVault.basics?.full_name?.replace(/\s+/g, '_') || 'Candidate'}_${targetRoleClean}_ATS.pdf`

      await generateAndDownloadPDF(
        settings.backendUrl,
        loadedVault,
        pipelineResult.tailored_resume,
        filename
      )
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download PDF.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const charCount = jdText.length
  const isJdValid = charCount >= 50
  const isBusy = appState !== 'idle' && appState !== 'completed' && appState !== 'error'

  return (
    <div className="flex flex-col min-h-[480px] bg-slate-50 text-slate-800 text-xs">
      {/* Header */}
      <header className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center font-bold text-white text-xs shadow-inner">
            R
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight tracking-tight">Resumme Builder</h1>
            <p className="text-[10px] text-slate-400">Step 4: Live Portal ATS Tailor</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded transition border ${
            showSettings
              ? 'bg-slate-800 border-slate-700 text-emerald-400'
              : 'hover:bg-slate-800 border-transparent text-slate-300'
          }`}
          title="Extension Configuration"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="bg-slate-100 border-b border-slate-300 p-3 space-y-2.5 text-xs animate-fadeIn">
          <div className="flex justify-between items-center pb-1 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Backend & Vault Settings</span>
            <span className="text-[10px] text-slate-500">FastAPI & Storage</span>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Backend URL</label>
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="http://localhost:8000"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Truth Vault User ID</label>
            <input
              type="text"
              value={settings.userId}
              onChange={(e) => setSettings({ ...settings, userId: e.target.value })}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="test-user"
            />
          </div>

          {vaultStatus && (
            <div className={`p-1.5 rounded text-[11px] ${vaultStatus.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
              {vaultStatus}
            </div>
          )}

          <div className="flex space-x-2 pt-1">
            <button
              onClick={handleTestVault}
              disabled={isCheckingVault}
              className="flex-1 px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition text-[11px] font-medium"
            >
              {isCheckingVault ? 'Verifying...' : 'Verify Vault'}
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-[11px] font-medium shadow-sm"
            >
              Save & Apply
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-3 space-y-3">
        {/* Portal & Extraction Source Banner */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-2.5 py-1.5 shadow-xs">
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            <span className="font-semibold text-slate-800 truncate">{portal}</span>
            {extractedLayer && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                {extractedLayer}
              </span>
            )}
          </div>
          <button
            onClick={triggerExtraction}
            disabled={isBusy}
            className="flex-shrink-0 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium ml-2 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition flex items-center space-x-1"
            title="Scan active page again"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Scan Page</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded p-2.5 text-red-700 flex items-start space-x-2 animate-fadeIn">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 text-[11px] leading-tight">
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Dynamic View: Pipeline In Progress */}
        {isBusy ? (
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center space-y-3 shadow-xs">
            <div className="w-8 h-8 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="font-semibold text-slate-800 text-xs">Multi-Agent Tailoring Active</p>
              <p className="text-[11px] text-slate-500 mt-1">{progressMsg}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse w-3/4 mx-auto" />
            </div>
          </div>
        ) : pipelineResult ? (
          /* Results View */
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-xs animate-fadeIn">
            {/* Score & Verdict Banner */}
            <div className={`p-2.5 rounded-md border flex items-center justify-between ${
              pipelineResult.ats_critique.score >= 85
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase">ATS Match Score</span>
                <p className="text-xl font-extrabold leading-none mt-0.5">
                  {pipelineResult.ats_critique.score}
                  <span className="text-xs font-normal opacity-70"> / 100</span>
                </p>
                <p className="text-[10px] font-medium mt-1">
                  {pipelineResult.ats_critique.score >= 85
                    ? '✓ Meets ATS Target (>=85%)'
                    : '⚠ Best Effort (Vault Grounded)'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-white/80 border border-current shadow-xs">
                  {pipelineResult.attempts === 1 ? '1 Attempt' : `${pipelineResult.attempts} Retries`}
                </span>
                <p className="text-[10px] opacity-80 mt-1">
                  {pipelineResult.tailored_resume.selected_project_ids.length} Projects Selected
                </p>
              </div>
            </div>

            {/* Target Role & Summary */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">Target Role</span>
                <span className="text-[10px] font-medium text-slate-700 truncate max-w-[180px]">
                  {pipelineResult.tailored_resume.target_role}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 italic line-clamp-3">
                "{pipelineResult.tailored_resume.professional_summary}"
              </p>
            </div>

            {/* Matched Keywords */}
            {pipelineResult.ats_critique.matched_keywords.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Matched Keywords ({pipelineResult.ats_critique.matched_keywords.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {pipelineResult.ats_critique.matched_keywords.slice(0, 8).map((kw, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-medium">
                      {kw}
                    </span>
                  ))}
                  {pipelineResult.ats_critique.matched_keywords.length > 8 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{pipelineResult.ats_critique.matched_keywords.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-1 space-y-1.5">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPdf}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-xs transition flex items-center justify-center space-x-1.5 text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download ATS Resume (PDF)'}</span>
              </button>

              <button
                onClick={() => setPipelineResult(null)}
                className="w-full py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition"
              >
                ← Tailor another job description
              </button>
            </div>
          </div>
        ) : (
          /* Input / Ready View */
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Target Job Description
                </label>
                <span className={`text-[10px] font-medium ${isJdValid ? 'text-slate-500' : 'text-amber-600'}`}>
                  {charCount} chars {charCount < 50 ? '(min 50)' : '✓'}
                </span>
              </div>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste or highlight job description text here, or open any supported portal (LinkedIn, Naukri, Indeed, Workday, etc.)..."
                rows={7}
                className="w-full px-2.5 py-2 text-[11px] leading-relaxed bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition resize-none font-mono"
              />
            </div>

            {!isJdValid && (
              <p className="text-[10px] text-slate-500 bg-slate-100 p-2 rounded border border-slate-200">
                💡 <span className="font-medium text-slate-700">Tip:</span> If you are on a job posting page, click <b>Scan Page</b> above or highlight the text on the page with your cursor.
              </p>
            )}

            {/* Primary Action Button */}
            <button
              onClick={handleGenerateResume}
              disabled={!isJdValid || isBusy}
              className={`w-full py-2.5 px-3 rounded font-medium shadow-xs transition flex items-center justify-center space-x-1.5 text-xs ${
                isJdValid
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Tailor ATS Resume (3-Agent Core)</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <footer className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span>Truth Vault: <b className="text-slate-700">{settings.userId}</b></span>
        <span>Zero Hallucinations</span>
      </footer>
    </div>
  )
}
