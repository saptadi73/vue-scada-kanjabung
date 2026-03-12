const SCADA_API_BASE_URL = (import.meta.env.VITE_SCADA_API_BASE_URL || '/api/scada').replace(
  /\/$/,
  '',
)
const SCADA_HOST = (import.meta.env.VITE_SCADA_HOST || '').replace(/\/$/, '')
const SCADA_AUTH_URL = (import.meta.env.VITE_SCADA_AUTH_URL || '').trim()
const SCADA_DB = import.meta.env.VITE_SCADA_DB
const SCADA_LOGIN = import.meta.env.VITE_SCADA_LOGIN
const SCADA_PASSWORD = import.meta.env.VITE_SCADA_PASSWORD

let sessionReady = false
let sessionPromise = null

function resolveErrorMessage(payload, fallback = 'Request failed') {
  return payload?.message || payload?.error?.message || fallback
}

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function buildEndpointUrl(endpoint) {
  const normalizedEndpoint = endpoint.replace(/^\//, '')
  return `${SCADA_API_BASE_URL}/${normalizedEndpoint}`
}

function buildAuthCandidates() {
  const candidates = []

  if (SCADA_AUTH_URL) {
    candidates.push(SCADA_AUTH_URL)
  }

  candidates.push(buildEndpointUrl('authenticate'))

  if (SCADA_HOST) {
    candidates.push(`${SCADA_HOST}/web/session/authenticate`)
  }

  return [...new Set(candidates)]
}

function isWebSessionAuthUrl(url) {
  return /\/web\/session\/authenticate$/i.test(url)
}

function buildAuthPayload(url) {
  if (isWebSessionAuthUrl(url)) {
    return {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        db: SCADA_DB,
        login: SCADA_LOGIN,
        password: SCADA_PASSWORD,
      },
    }
  }

  return {
    db: SCADA_DB,
    login: SCADA_LOGIN,
    password: SCADA_PASSWORD,
  }
}

function isAuthSuccess(payload, url) {
  if (isWebSessionAuthUrl(url)) {
    return Boolean(payload?.result?.uid)
  }

  return payload && payload?.status !== 'error'
}

export async function authenticateScadaSession(force = false) {
  if (!force && sessionReady) {
    return true
  }

  if (sessionPromise && !force) {
    return sessionPromise
  }

  if (!SCADA_DB || !SCADA_LOGIN || !SCADA_PASSWORD) {
    throw new Error(
      'Konfigurasi SCADA belum lengkap. Isi VITE_SCADA_DB, VITE_SCADA_LOGIN, dan VITE_SCADA_PASSWORD di .env.',
    )
  }

  sessionPromise = (async () => {
    const authCandidates = buildAuthCandidates()
    const errors = []

    for (const authUrl of authCandidates) {
      try {
        const response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(buildAuthPayload(authUrl)),
        })

        const payload = await parseResponse(response)

        if (!response.ok) {
          errors.push(`${authUrl}: HTTP ${response.status}`)
          continue
        }

        if (!isAuthSuccess(payload, authUrl)) {
          errors.push(`${authUrl}: ${resolveErrorMessage(payload, 'auth failed')}`)
          continue
        }

        sessionReady = true
        return true
      } catch (error) {
        errors.push(`${authUrl}: ${error?.message || 'auth failed'}`)
      }
    }

    throw new Error(
      `Autentikasi SCADA gagal. Percobaan endpoint: ${errors.join(' | ') || 'tidak ada endpoint auth yang valid'}`,
    )
  })()

  try {
    return await sessionPromise
  } finally {
    sessionPromise = null
  }
}

export async function callScadaJsonRpc(endpoint, params = {}, retry = true) {
  const response = await fetch(buildEndpointUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params,
    }),
  })

  const payload = await parseResponse(response)

  if (response.status === 401 && retry) {
    await authenticateScadaSession(true)
    return callScadaJsonRpc(endpoint, params, false)
  }

  if (response.status === 404) {
    throw new Error(
      `Endpoint ${endpoint} tidak ditemukan (404). Pastikan modul API SCADA aktif dan VITE_SCADA_API_BASE_URL benar.`,
    )
  }

  // JSON-RPC wraps actual data inside payload.result
  const result = payload?.result ?? payload

  if (!response.ok || result?.status === 'error' || payload?.error) {
    throw new Error(resolveErrorMessage(result || payload, `Gagal memanggil endpoint ${endpoint}`))
  }

  return result
}
