/**
 * dsh-codegraph-search — out-of-tree bundle for DeepSeek Harness (dsh web).
 *
 * Host half: a workspace search backend served on the dsh web server (the
 * pattern dsh-taskboard uses). One panel, two modes:
 *
 *   POST /workspace-search/search
 *     mode omitted | 'keyword':
 *       {root, query, caseSensitive?, regex?, include?, exclude?, types?}
 *       → {ok: true, value: {query, root, scanned, results, …}}  (tree walk)
 *       with stream: true → NDJSON: one
 *         {type:'file', file}     line per result group as it is found, then
 *         {type:'done', …counters} summary line (validation errors are still
 *         answered with a single JSON envelope)
 *     mode 'codegraph':
 *       {root, query, limit?, kind?}
 *       → {ok: true, value: {mode, query, root, results: [symbol…]}}
 *       (shells out to the `codegraph` CLI: `query -p <root> -j`)
 *
 *   POST /workspace-search/graph
 *     {root, symbol, direction: 'callers' | 'callees', limit?}
 *     → {ok: true, value: {symbol, direction, root, results: [symbol…]}}
 *
 * Keyword mode walks the tree with bounded breadth (skip .git/node_modules/
 * hidden by default), matches the query against file NAMES and text-file
 * CONTENT lines, and returns per-file match groups with line numbers. All
 * caps are honored and reported so the client can render "truncated" states
 * honestly. Codegraph mode needs a `codegraph init`-ed project; CLI failures
 * come back as stable error codes plus details the client localizes.
 *
 * Note: this host half deliberately does NOT inject the `connection` service
 * — it does not exist in the web host profile, and depending on it left the
 * fiber permanently failed.
 */
import z from '@deepseek-ai/schemastery'
import { execFile } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import { isAbsolute, join, basename, relative } from 'node:path'

export const name = 'code-search'

/** The host half needs no injected services at the top level. */
export const inject = []

export const Config = z.object({
  /** Hard cap on files scanned per search. Defaults to 5000. */
  maxFiles: z.number().step(1).min(1).default(5000),
  /** Hard cap on total content matches per search. Defaults to 300. */
  maxMatches: z.number().step(1).min(1).default(300),
  /** Hard cap on one matched line's reported length. Defaults to 300. */
  maxLineLength: z.number().step(1).min(20).default(300),
  /** Files above this size are skipped for content scan. Defaults to 1 MiB. */
  maxFileBytes: z.number().step(1).min(1024).default(1048576),
  /** CLI binary for the codegraph search mode and graph calls. On PATH by default. */
  codegraphBin: z.string().default('codegraph'),
  /** Timeout for one codegraph CLI call. Defaults to 15s. */
  codegraphTimeoutMs: z.number().step(1).min(1000).default(15000),
  /** Cap on symbols returned by one codegraph query / graph call. */
  codegraphMaxResults: z.number().step(1).min(1).default(50),
})

/** Directories never entered during the walk. */
const SKIP_DIRS = new Set(['.git', 'node_modules', '.hg', '.svn', 'dist', 'build', '.next', 'target'])

function internalError(message) {
  return { ok: false, error: { code: 'internal', message, details: {} } }
}

function ok(value) {
  return { ok: true, value }
}

function looksBinary(buf) {
  const head = buf.subarray(0, Math.min(buf.length, 8192))
  for (const byte of head) if (byte === 0) return true
  return false
}

async function* walkFiles(dir, root, matcher, seen) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      const rel = relPath(root, full)
      if (matcher.excludeDir(rel)) continue
      if (seen.has(full)) continue
      seen.add(full)
      yield* walkFiles(full, root, matcher, seen)
      continue
    }
    if (entry.isFile()) yield full
  }
}

/**
 * VS Code-flavored glob → RegExp. Supports double-star (any depth), `*`
 * (within a segment), `?` (one char), and `{a,b}` alternation. A pattern
 * without a slash matches the basename anywhere; a pattern with a slash
 * matches the root-relative path (a leading double-star-slash is allowed,
 * a leading slash is stripped).
 */
function globToRegExp(pattern) {
  let pat = pattern.replace(/\\/g, '/')
  const leading = pat.startsWith('**/') ? '**/' : ''
  if (leading !== '') pat = pat.slice(3)
  if (pat.startsWith('/')) pat = pat.slice(1)
  const hasSlash = pat.includes('/')
  let re = ''
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i]
    if (c === '*') {
      if (pat[i + 1] === '*') {
        re += '.*'
        i += 1
        if (pat[i + 1] === '/') i += 1
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') {
      re += '[^/]'
    } else if (c === '{') {
      const close = pat.indexOf('}', i)
      if (close === -1) {
        re += '\\{'
      } else {
        const alts = pat.slice(i + 1, close).split(',').map(escapeRegex)
        re += `(?:${alts.join('|')})`
        i = close
      }
    } else {
      re += escapeRegex(c)
    }
  }
  if (hasSlash) {
    return new RegExp(`^(?:${re})${leading === '**/' ? '' : ''}`)
  }
  return new RegExp(`^[^/]*${re}$`)
}

function escapeRegex(chunk) {
  return chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function relPath(root, full) {
  const rel = relative(root, full).replace(/\\/g, '/')
  return rel
}

function compileGlobs(list, dirMode) {
  const patterns = String(list ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  const regexes = []
  for (const p of patterns) {
    try {
      const re = globToRegExp(p)
      regexes.push({ pattern: p, re, dirMode })
    } catch {
      // Invalid glob: ignored (VS Code behavior for syntactically odd patterns).
    }
  }
  return regexes
}

/**
 * Compile a file-extension allowlist into a name predicate, or undefined when
 * the list is empty (meaning "every type"). Extensions are normalized to a
 * leading dot and matched case-insensitively against the name's last dot
 * segment, so `ts` and `.TS` both select `foo.d.ts` while dotfiles such as
 * `.gitignore` never match. This filter is a budget-shaping tool, not a speed
 * one: it decides which files the maxFiles allowance is spent on.
 * @param types - raw extension list from the request payload.
 * @returns a predicate over a basename, or undefined for "no type filter".
 */
function compileTypes(types) {
  if (!Array.isArray(types)) return undefined
  const exts = new Set()
  for (const raw of types) {
    if (typeof raw !== 'string') continue
    const t = raw.trim().toLowerCase()
    if (t === '') continue
    exts.add(t.startsWith('.') ? t : `.${t}`)
  }
  if (exts.size === 0) return undefined
  return (name) => {
    const dot = name.lastIndexOf('.')
    return dot > 0 && exts.has(name.slice(dot).toLowerCase())
  }
}

/**
 * Validate a keyword request, resolve its root, and precompile its matchers.
 * Returns either an `ok:false` envelope (the shape the routes already return)
 * or the prepared walk state that runKeywordSearch consumes. Split out so the
 * streaming route can fail *before* it commits to a streamed response.
 */
async function prepareKeywordSearch(payload) {
  const root = typeof payload?.root === 'string' && payload.root.length > 0 ? payload.root : undefined
  const query = typeof payload?.query === 'string' ? payload.query : ''
  if (query.trim() === '') return { ok: false, error: { code: 'bad-request', message: 'empty query', details: {} } }
  if (root !== undefined && !isAbsolute(root)) return { ok: false, error: { code: 'bad-request', message: 'root must be an absolute path', details: {} } }

  const regexMode = payload.regex === true
  const caseSensitive = payload.caseSensitive === true
  let queryRe = null
  if (regexMode) {
    try {
      queryRe = new RegExp(query, caseSensitive ? '' : 'i')
    } catch {
      return { ok: false, error: { code: 'bad-request', message: 'invalid regular expression', details: {} } }
    }
  }

  const include = compileGlobs(payload.include, false)
  const exclude = compileGlobs(payload.exclude, false)
  const excludeDirs = compileGlobs(payload.exclude, true)

  const dirBlocked = (rel) => {
    const dirRel = rel.endsWith('/') ? rel : `${rel}/`
    for (const { re } of excludeDirs) {
      if (re.test(rel) || re.test(dirRel)) return true
    }
    return false
  }
  const fileBlocked = (rel, base) => {
    for (const { re } of exclude) if (re.test(rel) || re.test(base)) return true
    if (include.length > 0) {
      let hit = false
      for (const { re } of include) if (re.test(rel) || re.test(base)) { hit = true; break }
      if (!hit) return true
    }
    return false
  }

  let st
  try {
    st = root === undefined ? undefined : await stat(root)
  } catch {
    return { ok: false, error: { code: 'not-found', message: 'search root not found', details: {} } }
  }
  if (st !== undefined && !st.isDirectory()) return { ok: false, error: { code: 'bad-request', message: 'search root is not a directory', details: {} } }

  const needle = caseSensitive ? query : query.toLowerCase()
  const hasNeedle = (text) => {
    if (queryRe !== null) {
      queryRe.lastIndex = 0
      return queryRe.test(text)
    }
    return (caseSensitive ? text : text.toLowerCase()).includes(needle)
  }

  return {
    ok: true,
    root,
    rootDir: root ?? process.cwd(),
    query,
    needle,
    hasNeedle,
    fileBlocked,
    matcher: { excludeDir: dirBlocked },
    typeOk: compileTypes(payload.types),
  }
}

/** Result order in the buffered response: files with matches first, then by path. */
function compareGroups(a, b) {
  const am = a.matches.length > 0 ? 1 : 0
  const bm = b.matches.length > 0 ? 1 : 0
  if (am !== bm) return bm - am
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

/**
 * Walk the prepared tree once, handing every result group to `emit` the moment
 * it is found. Both routes share this loop, so a streamed set and a buffered set
 * cannot drift apart; only the buffered route sorts (a streamed set is re-sorted
 * by the client once it receives the summary).
 */
async function runKeywordSearch(prep, config, emit) {
  const results = []
  let scanned = 0
  let typeSkipped = 0
  let truncatedFiles = false
  let truncatedMatches = false
  let totalMatches = 0

  for await (const file of walkFiles(prep.rootDir, prep.rootDir, prep.matcher, new Set())) {
    const rel = relPath(prep.rootDir, file)
    const name = basename(file)
    if (prep.fileBlocked(rel, name)) continue
    // Type filter runs before the budget is charged: the maxFiles allowance is
    // spent on files of the requested types, never on ones we would discard.
    if (prep.typeOk !== undefined && !prep.typeOk(name)) {
      typeSkipped += 1
      continue
    }
    scanned += 1
    if (scanned > config.maxFiles) {
      truncatedFiles = true
      break
    }
    const nameMatch = prep.hasNeedle(name)
    let matches = null
    let fileStat
    try {
      fileStat = await stat(file)
    } catch {
      fileStat = undefined
    }
    if (fileStat !== undefined && fileStat.size <= config.maxFileBytes) {
      let buf
      try {
        buf = await readFile(file)
      } catch {
        buf = undefined
      }
      if (buf !== undefined && !looksBinary(buf)) {
        const lines = buf.toString('utf8').split('\n')
        const found = []
        for (let i = 0; i < lines.length; i++) {
          if (!prep.hasNeedle(lines[i])) continue
          if (totalMatches >= config.maxMatches) {
            truncatedMatches = true
            break
          }
          totalMatches += 1
          found.push({
            line: i + 1,
            text: lines[i].length > config.maxLineLength
              ? `${lines[i].slice(0, config.maxLineLength)}…`
              : lines[i],
          })
        }
        if (found.length > 0) matches = found
      }
    }
    if (nameMatch || matches !== null) {
      const group = { path: file, name, nameMatch, matches: matches ?? [] }
      results.push(group)
      if (emit !== undefined) emit(group)
    }
  }

  if (emit === undefined) results.sort(compareGroups)

  return ok({
    ok: true,
    query: prep.query,
    root: prep.root ?? process.cwd(),
    scanned,
    typeSkipped,
    truncatedFiles,
    truncatedMatches,
    results,
  })
}

/** Buffered keyword search: the whole result set in one JSON envelope. */
async function searchEndpoint(payload, config) {
  const prep = await prepareKeywordSearch(payload)
  if (prep.ok !== true) return prep
  return runKeywordSearch(prep, config, undefined)
}

/**
 * Streamed keyword search: one NDJSON line per result group as soon as it is
 * found, then a `done` summary line. A request that fails validation is
 * answered with the usual single JSON envelope instead, so the client's error
 * path stays unchanged.
 */
async function streamKeywordSearch(payload, config, res) {
  const prep = await prepareKeywordSearch(payload)
  if (prep.ok !== true) {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(prep))
    return
  }
  res.writeHead(200, {
    'content-type': 'application/x-ndjson; charset=utf-8',
    'cache-control': 'no-store',
    'x-accel-buffering': 'no',
  })
  let count = 0
  const envelope = await runKeywordSearch(prep, config, (group) => {
    count += 1
    res.write(`${JSON.stringify({ type: 'file', file: group })}\n`)
  })
  if (envelope.ok !== true) {
    res.write(`${JSON.stringify({ type: 'error', error: envelope.error })}\n`)
  } else {
    const v = envelope.value
    res.write(`${JSON.stringify({
      type: 'done',
      query: v.query,
      root: v.root,
      scanned: v.scanned,
      typeSkipped: v.typeSkipped,
      truncatedFiles: v.truncatedFiles,
      truncatedMatches: v.truncatedMatches,
      count,
    })}\n`)
  }
  res.end()
}

// ── codegraph mode (shells out to the `codegraph` CLI) ──────────────────────

/** Run one codegraph CLI call; never rejects, carries the failure shape. */
function runCodegraph(bin, args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(bin, args, { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (!error) {
        resolve({ ok: true, stdout, stderr })
      } else if (error.code === 'ENOENT') {
        resolve({ ok: false, kind: 'missing' })
      } else if (error.killed === true || typeof error.signal === 'string') {
        // Killed by the timeout: signal is a string ('SIGTERM'); a plain
        // non-zero exit has signal === null, so only strings count here.
        resolve({ ok: false, kind: 'timeout' })
      } else {
        resolve({ ok: false, kind: 'exit', exitCode: typeof error.code === 'number' ? error.code : 1, stderr: String(stderr ?? '') })
      }
    })
  })
}

function fail(code, message, details = {}) {
  return { ok: false, error: { code, message, details } }
}

/** Map one codegraph hit into a compact symbol row (root-relative + absolute). */
function symbolRow(hit, root) {
  const node = typeof hit?.node === 'object' && hit.node !== null ? hit.node : (hit ?? {})
  const filePath = String(node.filePath ?? '')
  return {
    name: node.name ?? '',
    qualifiedName: node.qualifiedName ?? node.name ?? '',
    kind: node.kind ?? '',
    language: node.language ?? '',
    filePath,
    path: filePath.length > 0 ? join(root, filePath) : root,
    startLine: node.startLine ?? 0,
    endLine: node.endLine ?? 0,
    signature: typeof node.signature === 'string' ? node.signature.slice(0, 200) : '',
    docstring: typeof node.docstring === 'string' ? node.docstring.replace(/\s+/g, ' ').trim().slice(0, 400) : '',
    isExported: node.isExported === true,
    score: typeof hit?.score === 'number' ? Math.round(hit.score * 10) / 10 : undefined,
  }
}

/** Shared CLI runner: returns {ok:true, parsed} or a fail envelope. */
async function codegraphCall(config, args, rootDir) {
  const run = await runCodegraph(config.codegraphBin, args, config.codegraphTimeoutMs)
  if (!run.ok) {
    if (run.kind === 'missing') {
      return fail('codegraph-missing', `找不到 codegraph CLI（${config.codegraphBin}），请安装或调整 codegraphBin 配置`, { command: `${config.codegraphBin} --version` })
    }
    if (run.kind === 'timeout') {
      return fail('codegraph-timeout', `codegraph 调用超时（${config.codegraphTimeoutMs}ms）`, {})
    }
    const clean = run.stderr.replace(/\u001b\[[0-9;]*m/g, '').trim()
    if (/not initialized/i.test(clean)) {
      return fail('codegraph-not-initialized', '该工作区尚未建立代码图索引', { command: `${config.codegraphBin} init ${rootDir}` })
    }
    return fail('codegraph-failed', clean.split('\n')[0] ?? `codegraph 退出码 ${run.exitCode}`, { exitCode: run.exitCode })
  }
  try {
    return { ok: true, parsed: JSON.parse(run.stdout || '[]') }
  } catch {
    return fail('codegraph-parse', 'codegraph JSON 输出解析失败（版本不匹配？）', {})
  }
}

function clampLimit(raw, max) {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n <= 0) return Math.min(20, max)
  return Math.min(n, max)
}

function resolveRoot(payload) {
  const root = typeof payload?.root === 'string' && payload.root.length > 0 ? payload.root : undefined
  if (root !== undefined && !isAbsolute(root)) return { error: 'root must be an absolute path' }
  return { rootDir: root ?? process.cwd() }
}

async function codegraphSearchEndpoint(payload, config) {
  const query = typeof payload?.query === 'string' ? payload.query : ''
  if (query.trim() === '') return fail('bad-request', 'empty query')
  const loc = resolveRoot(payload)
  if (loc.error !== undefined) return fail('bad-request', loc.error)
  const limit = clampLimit(payload.limit, config.codegraphMaxResults)
  const args = ['query', '-p', loc.rootDir, '-j', '-l', String(limit)]
  if (typeof payload.kind === 'string' && payload.kind.trim() !== '') args.push('-k', payload.kind.trim())
  args.push(query)
  const res = await codegraphCall(config, args, loc.rootDir)
  if (res.ok !== true) return res
  const rows = Array.isArray(res.parsed) ? res.parsed : []
  return ok({
    ok: true,
    mode: 'codegraph',
    query,
    root: loc.rootDir,
    count: rows.length,
    results: rows.map((hit) => symbolRow(hit, loc.rootDir)),
  })
}

async function graphEndpoint(payload, config) {
  const symbol = typeof payload?.symbol === 'string' ? payload.symbol.trim() : ''
  if (symbol === '') return fail('bad-request', 'empty symbol')
  const direction = payload.direction === 'callees' ? 'callees' : 'callers'
  const loc = resolveRoot(payload)
  if (loc.error !== undefined) return fail('bad-request', loc.error)
  const limit = clampLimit(payload.limit, config.codegraphMaxResults)
  const args = [direction, '-p', loc.rootDir, '-j', '-l', String(limit), symbol]
  const res = await codegraphCall(config, args, loc.rootDir)
  if (res.ok !== true) return res
  const raw = res.parsed
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.[direction]) ? raw[direction] : []
  return ok({
    ok: true,
    mode: 'graph',
    symbol,
    direction,
    root: loc.rootDir,
    results: list.map((item) => symbolRow(item, loc.rootDir)),
  })
}

/** Serve one search request over the dsh web server (the web GUI's only host transport). */
function registerWebRoutes(ctx, config) {
  const dispose = ctx.webServer.register({
    kind: 'prefix',
    path: '/workspace-search',
    handler: async (req, res) => {
      try {
        const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
        const isSearch = pathname === '/workspace-search/search'
        const isGraph = pathname === '/workspace-search/graph'
        if (!isSearch && !isGraph) {
          res.writeHead(404, { 'content-type': 'application/json' })
          res.end('{"ok":false,"error":{"code":"not-found","message":"unknown route","details":{}}}')
          return
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { allow: 'POST' })
          res.end()
          return
        }
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (body.length > 65536) break
        }
        let payload
        try {
          payload = JSON.parse(body || '{}')
        } catch {
          res.writeHead(400, { 'content-type': 'application/json' })
          res.end('{"ok":false,"error":{"code":"bad-request","message":"invalid JSON body","details":{}}}')
          return
        }
        let result
        if (isGraph) result = await graphEndpoint(payload, config)
        else if (payload.mode === 'codegraph') result = await codegraphSearchEndpoint(payload, config)
        else if (payload.stream === true) {
          await streamKeywordSearch(payload, config, res)
          return
        }
        else result = await searchEndpoint(payload, config)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        try {
          res.writeHead(500, { 'content-type': 'application/json' })
          res.end(JSON.stringify(internalError(message)))
        } catch {}
      }
    },
  })
  return dispose
}

export function apply(ctx, config) {
  // HTTP route on the dsh web server: the web GUI client's only host transport
  // (same pattern dsh-taskboard uses). Deliberately no `connection` inject:
  // that service does not exist in the web host profile and used to fail the fiber.
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => registerWebRoutes(webCtx, config), 'code-search: web route')
  })
}
