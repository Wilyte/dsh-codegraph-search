/**
 * dsh-codegraph-search — prebuilt client bundle for the dsh web shell.
 *
 * Registers a VS Code-style Search tab into the built-in right sidebar
 * (@deepseek-ai/dsh-client-ui-sidebar-right): a static tab type on
 * `ctx.sidebarRightTabs`, a body on the keyed `sidebar.right.pane.tab` seat,
 * a guide-page entry, and localized copy through the Client locale service.
 * Clicking a match opens the file (with a line jump) as a `dsh-resource://file/...`
 * resource, which the built-in text preview claims. Self-contained except for
 * the platform seed modules (react, UI primitives).
 */
window.__ModuleLoader__.load({
  id: "dsh-codegraph-search",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var React = require("react");
    var createElement = React.createElement;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useSyncExternalStore = React.useSyncExternalStore;
    var UiPrimitives = require("@deepseek-ai/dsh-client-ui-primitives");

    var ID = "dsh-codegraph-search";
    var KIND = "search";
    var NS = "workspaceSearch";
    var inject = ["slots", "locale", "sidebarRightTabs"];

    // ── copy (every user-facing string routes through the locale service) ───
    var zh = {
      "type.label": "搜索",
      "guide.title": "代码搜索",
      "guide.description": "搜索会话工作区内的文件名与文件内容，或用代码图检索符号",
      "input.placeholder": "搜索工作区（文件名 / 内容）…",
      "input.placeholder.cg": "检索符号（名称 / 限定名）…",
      "mode.keyword": "关键词",
      "mode.codegraph": "代码图",
      "toggle.case": "区分大小写",
      "toggle.regex": "使用正则表达式",
      "toggle.filters": "显示/隐藏包含与排除规则",
      "include.placeholder": "要包含的文件（如 src/**/*.ts、*.md）",
      "exclude.placeholder": "要排除的文件（如 **/vendor/**、*.min.js）",
      "status.searching": "正在搜索…",
      "status.streaming": "正在搜索… {files} 个文件 · {matches} 处匹配",
      "status.error": "错误：{message}",
      "status.scope": "范围：{path}",
      "status.noWorkspace": "未绑定工作区",
      "status.invalidRegex": "无效的正则表达式",
      "status.results": "{files} 个文件 · {matches} 处匹配",
      "status.symbols": "{count} 个符号",
      "status.truncFiles": " · 文件扫描已达上限",
      "status.truncMatches": " · 匹配数已达上限",
      empty: "无匹配结果",
      "cg.error.not-initialized": "此工作区尚未建立代码图索引",
      "cg.error.missing": "服务器上没有 codegraph CLI",
      "cg.error.timeout": "codegraph 查询超时，请稍后重试",
      "cg.error.parse": "codegraph 输出无法解析（版本不匹配？）",
      "cg.error.failed": "codegraph 调用失败",
      "cg.init.hint": "先在终端运行以下命令建立索引，然后重试：",
      "cg.copy": "复制命令",
      "cg.copied": "已复制 ✓",
      "graph.toggle": "展开调用链",
      "graph.callers": "调用方",
      "graph.callees": "被调方",
      "graph.loading": "加载调用链…",
      "graph.empty": "无",
      "graph.error": "调用链获取失败",
      "filters.types": "文件类型",
      "types.placeholder": "其他扩展名（逗号分隔，如 py、go）",
      "types.clear": "清除类型筛选",
      "status.typeSkipped": " · 已按类型跳过 {count} 个文件",
      "nameMatch.flag": "文件名匹配",
      "file.open": "打开文件",
      "kv.why": "Why",
      "kv.how": "How",
      "kv.what": "What",
      "impl.label": "底层实现",
      "intro.title": "两种检索方式",
      "intro.footnote": "输入后按 Enter 检索，Esc 清空。",
      "card.keyword.sub": "文件名 + 内容",
      "card.keyword.why": "找「这个词在哪、这个文件在哪」，不用逐个翻工作区。",
      "card.keyword.how": "输入文件名或内容片段，回车；可选包含 / 排除 glob、Aa 区分大小写、.* 正则。",
      "card.keyword.what": "文件名与文件内容（代码、注释、文档、配置），命中给出行号与该行内容，点一下跳过去。",
      "card.keyword.impl": "基于 Node 文件树遍历 + 逐行正则实现，无需索引、开箱即用。",
      "card.codegraph.sub": "符号 + 调用关系",
      "card.codegraph.why": "改名字、做重构前，先看清「谁在调它、它又调了谁」。",
      "card.codegraph.how": "输入符号名或限定名，回车；结果行可展开「调用方 / 被调方」。",
      "card.codegraph.what": "函数 / 方法 / 类等符号及其调用关系，默认最多 50 条。",
      "card.codegraph.impl": "基于 codegraph CLI + 本地索引实现，跨文件调用关系可直接查（需先 codegraph init）。",
    };
    /** English dictionary, mirroring the original shipped copy. */
    var en = {
      "type.label": "Search",
      "guide.title": "Code search",
      "guide.description": "Search file names and contents in this session's workspace, or query the code graph",
      "input.placeholder": "Search workspace (file names / content)…",
      "input.placeholder.cg": "Search symbols (name / qualified name)…",
      "mode.keyword": "Keyword",
      "mode.codegraph": "Code graph",
      "toggle.case": "Match case",
      "toggle.regex": "Use regular expression",
      "toggle.filters": "Toggle include/exclude patterns",
      "include.placeholder": "files to include (e.g. src/**/*.ts, *.md)",
      "exclude.placeholder": "files to exclude (e.g. **/vendor/**, *.min.js)",
      "status.searching": "Searching…",
      "status.streaming": "Searching… {files} files · {matches} matches",
      "status.error": "Error: {message}",
      "status.scope": "Scope: {path}",
      "status.noWorkspace": "No workspace bound",
      "status.invalidRegex": "Invalid regular expression",
      "status.results": "{files} files · {matches} matches",
      "status.symbols": "{count} symbols",
      "status.truncFiles": " · file scan truncated",
      "status.truncMatches": " · matches truncated",
      empty: "No matches",
      "cg.error.not-initialized": "This workspace has no code graph index yet",
      "cg.error.missing": "The codegraph CLI is not installed on the server",
      "cg.error.timeout": "The codegraph query timed out — retry shortly",
      "cg.error.parse": "Could not parse codegraph output (version mismatch?)",
      "cg.error.failed": "The codegraph call failed",
      "cg.init.hint": "Index this workspace first, then retry:",
      "cg.copy": "Copy command",
      "cg.copied": "Copied ✓",
      "graph.toggle": "Toggle call graph",
      "graph.callers": "Callers",
      "graph.callees": "Callees",
      "graph.loading": "Loading call graph…",
      "graph.empty": "none",
      "graph.error": "Call graph fetch failed",
      "filters.types": "File types",
      "types.placeholder": "Other extensions (comma separated, e.g. py, go)",
      "types.clear": "Clear type filter",
      "status.typeSkipped": " · {count} files skipped by type filter",
      "nameMatch.flag": "Matched by file name",
      "file.open": "Open file",
      "kv.why": "Why",
      "kv.how": "How",
      "kv.what": "What",
      "impl.label": "Under the hood",
      "intro.title": "Two ways to search",
      "intro.footnote": "Type, then press Enter to search; Esc clears.",
      "card.keyword.sub": "file names + contents",
      "card.keyword.why": "Find where a term or a file lives without browsing the workspace by hand.",
      "card.keyword.how": "Type a file name or content fragment, then Enter; optional include/exclude globs, Aa match case, .* regex.",
      "card.keyword.what": "File names and file contents (code, comments, docs, config) — each hit shows its line, and one click jumps there.",
      "card.keyword.impl": "Built on a Node file-tree walk + line-by-line regex — no index needed, works out of the box.",
      "card.codegraph.sub": "symbols + call relations",
      "card.codegraph.why": "Before a rename or refactor, see who calls it and what it calls.",
      "card.codegraph.how": "Type a symbol or qualified name, then Enter; expand callers / callees from a result row.",
      "card.codegraph.what": "Functions, methods, classes and their call relations, up to 50 by default.",
      "card.codegraph.impl": "Built on the codegraph CLI + a local index — cross-file call relations straight from the index (run codegraph init first).",
    };

    // ── module store (one shared search state, like VS Code's search view) ──
    var store = {
      mode: "keyword", // "keyword" | "codegraph"
      query: "",
      caseSensitive: false,
      regex: false,
      include: "",
      exclude: "",
      filtersOpen: false,
      typesInput: "", // raw text of the type field; palette chips rewrite it
      types: [], // normalized extensions (e.g. [".ts"]); empty means no type filter
      busy: false,
      error: null, // {message, code, details}
      result: null,
      // Signature of the inputs that produced `result`. When the pane remounts
      // (e.g. switching back from an opened file) it is unchanged, so the stored
      // list stays valid and no redundant re-search is fired.
      resultSig: null,
      expanded: {}, // file path -> bool (keyword mode)
      cgGraph: {}, // symbol key -> {open, busy, error, callers, callees}
      copied: false,
      token: 0,
    };
    // Results-list scroll offset, preserved across remounts (tab switches).
    var resultsScrollTop = 0;
    /**
     * Display throttle for streamed keyword results, in milliseconds. The first
     * groups render immediately; after that the list is updated at most once per
     * interval, so a fast walk cannot outrun the browser's painting.
     */
    var FLUSH_MS = 250;
    var listeners = new Set();
    function setStore(patch) {
      store = Object.assign({}, store, patch);
      listeners.forEach(function (l) { l(); });
    }
    function subscribe(fn) {
      listeners.add(fn);
      return function () { listeners.delete(fn); };
    }
    function useStore(sel) {
      return useSyncExternalStore(subscribe, function () { return sel(store); }, function () { return sel(store); });
    }

    var wire = {
      call: function () {
        return Promise.reject(new Error("dsh-codegraph-search: rpc not wired"));
      },
    };

    /** Carry the host's structured error code/details to the UI layer. */
    function errorFrom(result) {
      var err = new Error(result.error && result.error.message ? result.error.message : "request failed");
      err.code = result.error && result.error.code ? result.error.code : "unknown";
      err.details = (result.error && result.error.details) || {};
      return err;
    }

    /** Quick type-filter chips: the extensions this kind of workspace searches most. */
    var TYPE_PALETTE = [".ts", ".tsx", ".js", ".py", ".json", ".md"];
    /**
     * Normalize the free-form type field into extensions: "ts, *.TSX py" becomes
     * [".ts", ".tsx", ".py"]. An empty list means "no type filter", which the host
     * treats as unrestricted.
     * @param text - the raw field contents.
     * @returns normalized, de-duplicated extensions, each with a leading dot.
     */
    function parseTypes(text) {
      var seen = {};
      var out = [];
      String(text === undefined || text === null ? "" : text).split(/[\s,;]+/).forEach(function (raw) {
        var token = raw.trim().toLowerCase().replace(/^\*+/, "").replace(/^\.+/, "").replace(/\.+$/, "");
        if (token === "") return;
        // Only the last segment can match (the host compares the final
        // extension), so "node.d.ts" filters on ".ts" rather than nothing.
        var cut = token.lastIndexOf(".");
        var ext = "." + (cut === -1 ? token : token.slice(cut + 1));
        if (ext === ".") return;
        if (seen[ext] === true) return;
        seen[ext] = true;
        out.push(ext);
      });
      return out;
    }

    /**
     * Build the children of one result text with every occurrence of the search
     * term wrapped in a highlighted `mark`. Matching mirrors the host exactly:
     * literal and case-folded (the same `toLowerCase` + `indexOf` the walk uses)
     * unless regex mode is on, where the same pattern and case flags are replayed.
     * Text with no hit is returned as the plain string, so those rows keep their
     * original DOM and CSS.
     * @param text - a file name, a matched line, a symbol name or a signature.
     * @param query - the term that produced the current result set.
     * @param caseSensitive - the Aa toggle that produced it.
     * @param regex - the .* toggle that produced it.
     * @returns a plain string, or an array of strings and `mark` elements.
     */
    function highlight(text, query, caseSensitive, regex) {
      var source = String(text === undefined || text === null ? "" : text);
      var needle = String(query === undefined || query === null ? "" : query);
      if (source === "" || needle === "") return source;
      var spans = [];
      var push = function (from, to) {
        if (to > from) spans.push(source.slice(from, to));
      };
      var mark = function (value) {
        return createElement("mark", { className: "wss-hl", key: "hl:" + spans.length }, value);
      };
      var cursor = 0;
      if (regex === true) {
        var re;
        try {
          re = new RegExp(needle, caseSensitive === true ? "g" : "gi");
        } catch (err) {
          return source; // an unparsable pattern could not have matched either
        }
        var m;
        while ((m = re.exec(source)) !== null) {
          if (m[0] === "") { re.lastIndex += 1; continue; } // never spin on a zero-length match
          push(cursor, m.index);
          spans.push(mark(m[0]));
          cursor = m.index + m[0].length;
        }
      } else {
        var hay = caseSensitive === true ? source : source.toLowerCase();
        var ned = caseSensitive === true ? needle : needle.toLowerCase();
        var at = hay.indexOf(ned);
        while (at !== -1) {
          push(cursor, at);
          spans.push(mark(source.slice(at, at + ned.length)));
          cursor = at + ned.length;
          at = hay.indexOf(ned, cursor);
        }
      }
      if (spans.length === 0) return source;
      push(cursor, source.length);
      return spans;
    }

    /** Canonical signature of one search request; equal inputs give an equal string. */
    function searchSig(root, query, caseSensitive, regex, include, exclude, mode, types) {
      return JSON.stringify([
        mode,
        root === undefined ? "" : root,
        query,
        caseSensitive === true,
        regex === true,
        include === undefined ? "" : include,
        exclude === undefined ? "" : exclude,
        (types || []).slice().sort().join(","),
      ]);
    }

    /**
     * Leading-edge trailing throttle: the first \`request()\` runs \`run\` right
     * away, and any \`request()\` while a run is scheduled coalesces into it, so
     * \`run\` executes at most once per \`intervalMs\`. \`flush()\` runs the pending
     * work immediately (used when the stream ends, so the tail is never lost).
     * \`run\` is expected to no-op when it has nothing to do.
     * @param intervalMs - minimum spacing between two runs.
     * @param run - the work to perform.
     * @returns the request function, carrying \`flush\` and \`pending\`.
     */
    function createThrottle(intervalMs, run) {
      var scheduled = null;
      var lastRun = 0;
      var request = function () {
        if (scheduled !== null) return; // already coalescing into a pending run
        var wait = Math.max(0, intervalMs - (Date.now() - lastRun));
        scheduled = setTimeout(function () {
          scheduled = null;
          lastRun = Date.now();
          run();
        }, wait);
      };
      request.flush = function () {
        if (scheduled !== null) {
          clearTimeout(scheduled);
          scheduled = null;
        }
        lastRun = Date.now();
        run();
      };
      request.pending = function () { return scheduled !== null; };
      return request;
    }

    /**
     * Order used by the buffered host response: files with content matches
     * first, then by absolute path. A streamed result set is re-sorted with the
     * same comparator once its summary arrives, so both transports end in an
     * identical list.
     */
    function compareFileGroups(a, b) {
      var am = a.matches.length > 0 ? 1 : 0;
      var bm = b.matches.length > 0 ? 1 : 0;
      if (am !== bm) return bm - am;
      return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    }

    /**
     * Consume an NDJSON response line by line: every parsed line goes to
     * \`onMessage\`, and the promise resolves with the final \`done\` summary.
     * Lines split across chunk boundaries are reassembled, a trailing line
     * without its newline is still parsed at the end, and a \`error\` line
     * rejects the same way a buffered error envelope does. A response without a
     * readable body (or a host that answered with one JSON envelope) falls back
     * to parsing the whole text.
     * @param response - the fetch Response carrying the NDJSON body.
     * @param onMessage - called with every parsed line object.
     * @returns a promise for the summary line.
     */
    function readNdjsonStream(response, onMessage) {
      var summary = null;
      var failure = null;
      var handle = function (line) {
        if (line.trim() === "") return;
        var msg = JSON.parse(line);
        if (msg.type === "file") onMessage(msg.file);
        else if (msg.type === "done") summary = msg;
        else if (msg.type === "error") failure = msg.error;
      };
      var finish = function () {
        if (failure !== null) throw errorFrom({ error: failure });
        if (summary === null) throw new Error("stream ended without a summary");
        return summary;
      };
      if (response.body === undefined || response.body === null || typeof response.body.getReader !== "function") {
        return response.text().then(function (text) {
          text.split("\n").forEach(handle);
          return finish();
        });
      }
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var pump = function () {
        return reader.read().then(function (chunk) {
          if (chunk.done === true) {
            if (buffer.trim() !== "") handle(buffer);
            buffer = "";
            return null;
          }
          buffer += decoder.decode(chunk.value, { stream: true });
          var parts = buffer.split("\n");
          buffer = parts.pop();
          parts.forEach(handle);
          return pump();
        });
      };
      return pump().then(finish);
    }

    /**
     * Run one search. Keyword mode streams: a result group is rendered as soon
     * as the host finds it, coalesced into store updates so a long walk does not
     * re-render per file. Code graph mode stays buffered, and a host build that
     * answers a stream request with one JSON envelope is handled on the same
     * path, so both transports and both host builds end in an identical list.
     */
    function runSearch(root, query, caseSensitive, regex, include, exclude, mode, types) {
      if (query.trim() === "") {
        setStore({ query: query, result: null, error: null, resultSig: null });
        return;
      }
      if (mode === "codegraph" && (root === undefined || root === "")) {
        setStore({ query: query, busy: false, result: null, error: null, resultSig: null });
        return;
      }
      var token = store.token + 1;
      var sig = searchSig(root, query, caseSensitive, regex, include, exclude, mode, types);
      resultsScrollTop = 0; // a fresh result set starts at the top
      var payload = mode === "codegraph"
        ? { mode: "codegraph", root: root, query: query }
        : {
            mode: "keyword",
            root: root,
            query: query,
            caseSensitive: caseSensitive,
            regex: regex,
            include: include,
            exclude: exclude,
            types: types,
          };
      var fail = function (err) {
        if (store.token !== token) return;
        setStore({
          busy: false,
          error: {
            message: err && err.message ? err.message : "network",
            code: err && err.code ? err.code : "network",
            details: (err && err.details) || {},
          },
        });
      };

      if (mode === "codegraph") {
        setStore({ query: query, busy: true, error: null, token: token, copied: false });
        wire.call("/workspace-search", "search", payload).then(function (result) {
          if (!result.ok) throw errorFrom(result);
          return result.value;
        }).then(function (value) {
          if (store.token !== token) return;
          setStore({ busy: false, result: value, expanded: {}, cgGraph: {}, resultSig: sig });
        }, fail);
        return;
      }

      // ── keyword mode: progressive results ────────────────────────────────
      setStore({
        query: query,
        busy: true,
        error: null,
        token: token,
        copied: false,
        // An empty streamed set is still a set: it keeps the pane out of the
        // first-run intro, and lets the status line count up live.
        result: {
          ok: true,
          streaming: true,
          query: query,
          root: root,
          scanned: 0,
          typeSkipped: 0,
          truncatedFiles: false,
          truncatedMatches: false,
          results: [],
        },
      });
      var pending = [];
      var flush = function () {
        if (pending.length === 0) return;
        var batch = pending;
        pending = [];
        if (store.token !== token || store.result === null) return;
        setStore({ result: Object.assign({}, store.result, { results: store.result.results.concat(batch) }) });
      };
      var throttle = createThrottle(FLUSH_MS, flush);
      var onGroup = function (group) {
        if (store.token !== token) return;
        pending.push(group);
        throttle();
      };
      wire.stream("/workspace-search", "search", Object.assign({}, payload, { stream: true }), onGroup)
        .then(function (summary) {
          if (store.token !== token) return;
          throttle.flush();
          var streamed = store.result !== null && Array.isArray(store.result.results) ? store.result.results : [];
          setStore({
            busy: false,
            result: {
              ok: true,
              streaming: false,
              query: summary.query,
              root: summary.root,
              scanned: summary.scanned,
              typeSkipped: summary.typeSkipped,
              truncatedFiles: summary.truncatedFiles,
              truncatedMatches: summary.truncatedMatches,
              results: streamed.slice().sort(compareFileGroups),
            },
            cgGraph: {},
            resultSig: sig,
          });
        }, fail);
    }

    /** Open/close the lazy callers+callees panel for one symbol. */
    function toggleGraph(root, key) {
      var next = Object.assign({}, store.cgGraph);
      var cur = next[key];
      if (cur !== undefined) {
        if (cur.busy === true) return;
        next[key] = Object.assign({}, cur, { open: cur.open !== true });
        setStore({ cgGraph: next });
        return;
      }
      if (root === undefined || root === "") return;
      next[key] = { open: true, busy: true, error: null, callers: [], callees: [] };
      setStore({ cgGraph: next });
      var got = {};
      var settle = function () {
        if (got.callers === undefined || got.callees === undefined) return;
        var fresh = Object.assign({}, store.cgGraph[key]);
        fresh.busy = false;
        var msgs = [];
        ["callers", "callees"].forEach(function (dir) {
          if (got[dir].ok === true) fresh[dir] = got[dir].results;
          else msgs.push(got[dir].message);
        });
        fresh.error = msgs.length > 0 ? msgs[0] : null;
        var m = Object.assign({}, store.cgGraph);
        m[key] = fresh;
        setStore({ cgGraph: m });
      };
      ["callers", "callees"].forEach(function (dir) {
        wire.call("/workspace-search", "graph", { root: root, symbol: key, direction: dir, limit: 20 })
          .then(function (result) {
            if (!result.ok) return { ok: false, message: result.error && result.error.message ? result.error.message : "failed" };
            return { ok: true, results: result.value.results };
          }, function (err) {
            return { ok: false, message: err && err.message ? err.message : "network" };
          })
          .then(function (r) {
            got[dir] = r;
            settle();
          });
      });
    }

    // ── file addresses (same encoding as the built-in sidebar packages) ─────
    var FILE_ADDRESS_PREFIX = "dsh-resource://file/";
    /** Component-encode one id or path segment, keeping `:` literal for drive letters. */
    function encodeSegment(segment) {
      return encodeURIComponent(segment).replace(/%3A/gi, ":");
    }
    /** Encode a `/`-separated path segment by segment. */
    function encodePath(path) {
      return path.split("/").map(encodeSegment).join("/");
    }
    function isWindowsStylePath(value) {
      return /^[A-Za-z]:[/\\]/.test(value) || value.startsWith("\\\\");
    }
    function isAbsoluteWorkspacePath(path) {
      return path.startsWith("/") || isWindowsStylePath(path);
    }
    /** The `dsh-resource://file/session/<sessionId>/<path>` address of one Session's file. */
    function sessionFileAddress(sessionId, path) {
      var normalized = path.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
      return FILE_ADDRESS_PREFIX + "session/" + encodeSegment(sessionId) + "/" + encodePath(normalized);
    }
    /**
     * The address for a path as the caller holds it: a relative path, or an
     * absolute path inside the Session's workspace, becomes a session-relative
     * address; anything else keeps its absolute path in the Session's address.
     */
    function fileAddressFor(sessionId, cwd, path) {
      var normalized = path.replace(/\\/g, "/");
      if (!isAbsoluteWorkspacePath(normalized)) return sessionFileAddress(sessionId, normalized);
      var root = cwd === undefined ? "" : cwd.replace(/\\/g, "/").replace(/\/+$/, "");
      if (root !== "" && normalized === root) return sessionFileAddress(sessionId, "");
      if (root !== "" && normalized.indexOf(root + "/") === 0) return sessionFileAddress(sessionId, normalized.slice(root.length + 1));
      return sessionFileAddress(sessionId, normalized);
    }

    // ── stylesheet (mounted by apply, removed on dispose) ───────────────────
    var STYLE_ID = "dsh-codegraph-search-style";
    var STYLE_CSS = [
      "/* Every colour, radius and font below comes from the GUI's design tokens, so the",
      "* panel follows the active light/dark theme exactly like built-in panes do. */",
      ".wss-root{--wss-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);font-size:var(--dsw-font-xs-13-font-size);line-height:20px}",
      ".wss-root *{box-sizing:border-box}",
      ".wss-root button{font-family:inherit;font-size:inherit}",
      ".wss-root input{font-family:inherit}",
      ".wss-root button:focus-visible,.wss-root input:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}",
      ".wss-filerow,.wss-match,.wss-symmain,.wss-graph-item,.wss-case,.wss-chip,.wss-seg-b,.wss-graphbtn,.wss-copybtn{transition:background-color 120ms ease,color 120ms ease,border-color 120ms ease}",
      "@media (prefers-reduced-motion:reduce){.wss-root *{transition:none!important}}",
      ".wss-inputrow{display:flex;align-items:center;gap:6px;padding:8px 10px;flex:none}",
      ".wss-input{flex:1;min-width:0;height:28px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);padding:0 10px;font-size:13px;outline:none}",
      ".wss-input::placeholder{color:var(--dsw-alias-label-tertiary)}",
      ".wss-input:focus{border-color:var(--dsw-alias-brand-primary)}",
      ".wss-seg{display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:2px;padding:2px;flex:none;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-interactive-bg-hover)}",
      ".wss-seg-b{height:24px;padding:0 10px;border:none;border-radius:var(--dsw-radius-xs);background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:500;white-space:nowrap;cursor:pointer}",
      ".wss-seg-b:hover:not(:disabled){color:var(--dsw-alias-label-primary)}",
      ".wss-seg-on{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-soft)}",
      ".wss-case{width:28px;height:28px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:.5px solid transparent;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer}",
      ".wss-case:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".wss-case:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}",
      ".wss-case-on,.wss-case-on:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-fill);border-color:var(--dsw-alias-button-ghost-active-border);color:var(--dsw-alias-label-primary)}",
      ".wss-case-on:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-hover)}",
      ".wss-filters{display:flex;flex-direction:column;gap:6px;padding:0 10px 8px;flex:none}",
      ".wss-root .wss-filter-input{height:28px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);padding:0 8px;font-family:var(--wss-mono);font-size:11px;outline:none}",
      ".wss-filter-input::placeholder{color:var(--dsw-alias-label-tertiary)}",
      ".wss-filter-input:focus{border-color:var(--dsw-alias-brand-primary)}",
      ".wss-typerow{display:flex;align-items:center;gap:4px;flex-wrap:wrap}",
      ".wss-typelabel{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-right:2px}",
      ".wss-root .wss-chip{height:22px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l3);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:var(--wss-mono);font-size:11px;line-height:20px;cursor:pointer}",
      ".wss-chip:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".wss-root .wss-chip-on,.wss-root .wss-chip-on:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-fill);border-color:var(--dsw-alias-button-ghost-active-border);color:var(--dsw-alias-label-primary)}",
      ".wss-root .wss-chip-on:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-hover)}",
      ".wss-status{flex:none;padding:0 12px 8px;color:var(--dsw-alias-label-tertiary);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".wss-results{flex:1;min-height:0;overflow-y:auto;padding:0 6px 12px}",
      ".wss-empty{padding:18px 12px;color:var(--dsw-alias-label-tertiary)}",
      ".wss-file{margin-bottom:1px}",
      ".wss-filerow{display:flex;align-items:center;gap:6px;width:100%;padding:4px 8px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;text-align:left;cursor:pointer}",
      ".wss-filerow:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".wss-filerow:active{background:var(--dsw-alias-interactive-bg-active)}",
      ".wss-caret{width:12px;flex:none;color:var(--dsw-alias-label-tertiary);font-size:10px}",
      ".wss-filename{flex:none;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}",
      ".wss-flag{flex:none;color:var(--dsw-alias-brand-primary);font-size:10px;line-height:1}",
      ".wss-filedir{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-family:var(--wss-mono);font-size:11px;direction:rtl;text-align:left}",
      ".wss-count{flex:none;padding:0 6px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}",
      ".wss-count-zero{color:var(--dsw-alias-label-dimmed)}",
      ".wss-match{display:flex;gap:8px;width:100%;padding:2px 8px 2px 26px;border:none;border-radius:var(--dsw-radius-xs);background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;text-align:left;cursor:pointer}",
      ".wss-match:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".wss-lineno{flex:none;min-width:34px;text-align:right;color:var(--dsw-alias-label-dimmed);font-family:var(--wss-mono);font-size:11px;user-select:none}",
      ".wss-linetext{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--wss-mono);font-size:11px}",
      ".wss-hl{background:var(--dsw-alias-interactive-bg-active);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 32%,transparent);border-radius:2px;color:inherit;padding:0 1px}",
      ".wss-sym{margin-bottom:1px}",
      ".wss-symrow{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:var(--dsw-radius-sm)}",
      ".wss-symrow:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".wss-symmain{display:flex;align-items:center;gap:6px;flex:1;min-width:0;padding:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;text-align:left;cursor:pointer}",
      ".wss-kind{flex:none;padding:1px 5px;border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);font-family:var(--wss-mono);font-size:10px}",
      ".wss-symname{flex:none;max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}",
      ".wss-signature{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-family:var(--wss-mono);font-size:11px}",
      ".wss-symloc{flex:none;max-width:32%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-family:var(--wss-mono);font-size:11px;direction:rtl;text-align:right}",
      ".wss-score{flex:none;color:var(--dsw-alias-label-dimmed);font-size:10px}",
      ".wss-graphbtn{flex:none;width:20px;height:20px;padding:0;border:none;border-radius:var(--dsw-radius-xs);background:transparent;color:var(--dsw-alias-label-dimmed);font-size:10px;cursor:pointer}",
      ".wss-graphbtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".wss-graphbtn-on{color:var(--dsw-alias-label-primary)}",
      ".wss-doc{padding:0 8px 6px 26px;color:var(--dsw-alias-label-tertiary);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".wss-graph{display:flex;flex-direction:column;gap:4px;padding:2px 8px 8px 26px}",
      ".wss-graph-head{margin-bottom:1px;color:var(--dsw-alias-label-tertiary);font-size:11px;letter-spacing:.05em;text-transform:uppercase}",
      ".wss-graph-item{display:flex;align-items:center;gap:6px;width:100%;padding:2px 6px;border:none;border-radius:var(--dsw-radius-xs);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px;text-align:left;cursor:pointer}",
      ".wss-graph-item:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".wss-graph-none{padding:1px 6px;color:var(--dsw-alias-label-dimmed);font-size:11px}",
      ".wss-errblock{display:flex;flex-direction:column;gap:8px;padding:12px}",
      ".wss-errmsg{color:var(--dsw-alias-state-error-primary);font-size:12px}",
      ".wss-errhint{color:var(--dsw-alias-label-tertiary);font-size:11px}",
      ".wss-code{display:flex;align-items:center;gap:6px;margin-top:6px}",
      ".wss-code code{flex:1;min-width:0;background:var(--dsw-alias-markdown-inline-code,var(--dsw-alias-bg-layer-3));border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-xs);padding:4px 8px;color:var(--dsw-alias-label-secondary);font-family:var(--wss-mono);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".wss-copybtn{flex:none;height:24px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer}",
      ".wss-copybtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".wss-intro{display:flex;flex-direction:column;gap:8px;padding:2px 12px 16px}",
      ".wss-intro-title{color:var(--dsw-alias-label-tertiary);font-size:11px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:2px}",
      ".wss-card{display:flex;flex-direction:column;gap:5px;padding:10px;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2)}",
      ".wss-card-head{display:flex;align-items:baseline;gap:6px}",
      ".wss-card-title{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600}",
      ".wss-card-sub{color:var(--dsw-alias-label-tertiary);font-size:11px}",
      ".wss-kv{display:flex;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:19px}",
      ".wss-kv-k{flex:none;width:30px;color:var(--dsw-alias-label-tertiary);font-size:11px}",
      ".wss-kv-v{flex:1;min-width:0}",
      ".wss-impl{margin-top:1px;padding-top:6px;border-top:.5px dashed var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px}",
      ".wss-impl-k{margin-right:6px;color:var(--dsw-alias-label-secondary);font-weight:600}",
      ".wss-intro-foot{color:var(--dsw-alias-label-tertiary);font-size:11px}",
    ].join("\n");
    function mountStyle() {
      if (typeof document === "undefined") return function () {};
      if (document.getElementById(STYLE_ID)) return function () {};
      var style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_CSS;
      document.head.appendChild(style);
      return function () {
        if (style.isConnected) style.remove();
      };
    }

    // ── component ────────────────────────────────────────────────────────────
    /**
     * The search tab body, drawn in a right-sidebar pane. The seat injects the
     * tab's navigation domain, the bound Session, and the locale copy.
     * @param props - { sessionId, useSessions, useTabInfo, t } from the keyed seat.
     * @returns the VS Code-style search panel.
     */
    function SearchBody(props) {
      var sessionId = props.sessionId;
      var useSessions = props.useSessions;
      var useTabInfo = props.useTabInfo;
      var t = props.t;
      var tab = useTabInfo().tab;
      var cwd = useSessions(function (sessions) { return sessions.byId[sessionId] === undefined ? undefined : sessions.byId[sessionId].cwd; });

      var mode = useStore(function (s) { return s.mode; });
      var query = useStore(function (s) { return s.query; });
      var caseSensitive = useStore(function (s) { return s.caseSensitive; });
      var regex = useStore(function (s) { return s.regex; });
      var include = useStore(function (s) { return s.include; });
      var exclude = useStore(function (s) { return s.exclude; });
      var filtersOpen = useStore(function (s) { return s.filtersOpen; });
      var typesInput = useStore(function (s) { return s.typesInput; });
      var types = useStore(function (s) { return s.types; });
      var busy = useStore(function (s) { return s.busy; });
      var error = useStore(function (s) { return s.error; });
      var result = useStore(function (s) { return s.result; });
      var expanded = useStore(function (s) { return s.expanded; });
      var cgGraph = useStore(function (s) { return s.cgGraph; });
      var copied = useStore(function (s) { return s.copied; });
      var isCg = mode === "codegraph";
      var resultsRef = useRef(null);

      // Remounting rebuilds the DOM, which would drop the scroll offset; put the
      // list back where the user left it when they switched away and came back.
      useEffect(function () {
        var el = resultsRef.current;
        if (el && resultsScrollTop > 0) el.scrollTop = resultsScrollTop;
      }, []);

      useEffect(function () {
        // `resultSig` describes the inputs that produced the stored result. When
        // it already matches — most importantly when the pane remounts after the
        // user opened a file and switched back — the previous list is still
        // valid, so keep it instead of re-searching and refreshing underneath them.
        var sig = searchSig(cwd, store.query, store.caseSensitive, store.regex, store.include, store.exclude, store.mode, store.types);
        if (store.query === "" || store.resultSig === sig) return undefined;
        var timer = setTimeout(function () {
          if (store.query !== "" && !store.busy && store.resultSig !== sig) {
            runSearch(cwd, store.query, store.caseSensitive, store.regex, store.include, store.exclude, store.mode, store.types);
          }
        }, 250);
        return function () { clearTimeout(timer); };
      }, [mode, query, caseSensitive, regex, include, exclude, cwd, types]);

      var openFile = function (path, line) {
        tab.actions.openResource(
          fileAddressFor(sessionId, cwd, path),
          line === undefined ? undefined : { params: { line: line } },
        );
      };

      var submitNow = function () { runSearch(cwd, query, caseSensitive, regex, include, exclude, mode, types); };

      var switchMode = function (m) {
        if (store.mode === m) return;
        setStore({ mode: m, result: null, error: null, busy: false, expanded: {}, cgGraph: {}, copied: false });
        if (store.query !== "") runSearch(cwd, store.query, store.caseSensitive, store.regex, store.include, store.exclude, m, store.types);
      };

      /** Toggle one palette chip, keeping the free-form type field in sync with it. */
      var toggleType = function (ext) {
        var next = types.indexOf(ext) === -1
          ? types.concat([ext])
          : types.filter(function (x) { return x !== ext; });
        setStore({ types: next, typesInput: next.map(function (x) { return x.slice(1); }).join(", ") });
      };

      var copyInit = function (command) {
        if (typeof navigator === "undefined" || navigator.clipboard === undefined) return;
        navigator.clipboard.writeText(command).then(function () {
          setStore({ copied: true });
          setTimeout(function () { setStore({ copied: false }); }, 1600);
        }, function () {});
      };

      var totalMatches = result !== null && !isCg ? result.results.reduce(function (n, r) { return n + r.matches.length; }, 0) : 0;
      var cgFail = error !== null && isCg && typeof error.code === "string" && error.code.indexOf("codegraph-") === 0 ? error : null;
      // Highlight the term that produced the stored result (the input box may have
      // moved on since), using the same case/regex flags that search ran with.
      var hlq = result !== null && typeof result.query === "string" ? result.query : "";

      // ── codegraph result rendering ─────────────────────────────────────────
      var renderGraph = function (entry) {
        if (entry.busy === true) return createElement("div", { className: "wss-graph" }, t("graph.loading"));
        if (entry.error !== null && entry.error !== undefined) {
          return createElement("div", { className: "wss-graph" }, t("graph.error") + "：" + entry.error);
        }
        var group = function (label, items) {
          return createElement("div", null,
            createElement("div", { className: "wss-graph-head" }, label + " · " + items.length),
            items.length === 0
              ? createElement("div", { className: "wss-graph-none" }, t("graph.empty"))
              : items.map(function (item, j) {
                return createElement("button", {
                  type: "button",
                  key: label + ":" + j + ":" + item.path + ":" + item.startLine,
                  className: "wss-graph-item",
                  title: (item.qualifiedName === "" ? item.name : item.qualifiedName) + " — " + item.path + ":" + item.startLine,
                  onClick: function () { openFile(item.path, item.startLine); },
                },
                  createElement("span", { className: "wss-kind" }, item.kind),
                  createElement("span", { className: "wss-symname" }, highlight(item.name, hlq, caseSensitive, regex)),
                  createElement("span", { className: "wss-symloc" }, item.filePath + ":" + item.startLine));
              }));
        };
        return createElement("div", { className: "wss-graph" }, group(t("graph.callers"), entry.callers), group(t("graph.callees"), entry.callees));
      };
      var renderSymbol = function (sym, i) {
        var key = sym.qualifiedName !== "" && sym.qualifiedName !== undefined ? sym.qualifiedName : sym.name;
        var entry = cgGraph[key];
        return createElement("div", { key: "sym:" + i + ":" + sym.path + ":" + sym.startLine, className: "wss-sym" },
          createElement("div", { className: "wss-symrow" },
            createElement("button", {
              type: "button",
              className: "wss-symmain",
              title: key + " — " + sym.path + ":" + sym.startLine,
              onClick: function () { openFile(sym.path, sym.startLine); },
            },
              createElement("span", { className: "wss-kind" }, sym.kind),
              createElement("span", { className: "wss-symname" }, highlight(sym.name, hlq, caseSensitive, regex)),
              sym.signature !== "" && sym.signature !== undefined ? createElement("span", { className: "wss-signature" }, highlight(sym.signature, hlq, caseSensitive, regex)) : null),
            createElement("span", { className: "wss-symloc" }, sym.filePath + ":" + sym.startLine + (sym.endLine > sym.startLine ? "-" + sym.endLine : "")),
            sym.score !== undefined && sym.score !== null ? createElement("span", { className: "wss-score" }, String(sym.score)) : null,
            createElement("button", {
              type: "button",
              className: "wss-graphbtn" + (entry !== undefined && entry.open === true ? " wss-graphbtn-on" : ""),
              title: t("graph.toggle"),
              onClick: function () { toggleGraph(cwd, key); },
            }, entry !== undefined && entry.open === true ? "▾" : "▸")),
          sym.docstring !== "" && sym.docstring !== undefined ? createElement("div", { className: "wss-doc" }, sym.docstring) : null,
          entry !== undefined && entry.open === true ? renderGraph(entry) : null);
      };

      // ── keyword result rendering ───────────────────────────────────────────
      var renderFile = function (r) {
        var open = expanded[r.path] === true;
        var hasMatches = r.matches.length > 0;
        return createElement("div", { key: r.path, className: "wss-file" },
          createElement("button", {
            type: "button",
            className: "wss-filerow",
            title: hasMatches ? r.path : t("file.open") + " — " + r.path,
            "aria-expanded": hasMatches ? (open ? "true" : "false") : undefined,
            onClick: function () {
              // A name-only hit has no lines to expand, so the row opens the file.
              if (!hasMatches) { openFile(r.path, 1); return; }
              var next = Object.assign({}, expanded);
              next[r.path] = !open;
              setStore({ expanded: next });
            },
          },
            createElement("span", { className: "wss-caret" }, hasMatches ? (open ? "▾" : "▸") : ""),
            createElement("span", { className: "wss-filename" }, highlight(r.name, hlq, caseSensitive, regex)),
            r.nameMatch ? createElement("span", { className: "wss-flag", title: t("nameMatch.flag") }, "⚑") : null,
            createElement("span", { className: "wss-filedir" }, r.path),
            createElement("span", { className: "wss-count" + (hasMatches ? "" : " wss-count-zero") }, String(r.matches.length))),
          hasMatches && open ? r.matches.map(function (m) {
            return createElement("button", {
              type: "button",
              key: r.path + ":" + m.line,
              className: "wss-match",
              title: r.path + ":" + m.line,
              onClick: function () { openFile(r.path, m.line); },
            },
              createElement("span", { className: "wss-lineno" }, String(m.line)),
              createElement("span", { className: "wss-linetext" }, highlight(m.text, hlq, caseSensitive, regex)));
          }) : null);
      };

      // First-entry empty state: one card per mode, each explaining Why / How /
      // What plus a one-line "under the hood" note.
      var introRow = function (label, text) {
        return createElement("div", { className: "wss-kv" },
          createElement("span", { className: "wss-kv-k" }, label),
          createElement("span", { className: "wss-kv-v" }, text));
      };
      var introCard = function (mode, sub) {
        return createElement("div", { className: "wss-card" },
          createElement("div", { className: "wss-card-head" },
            createElement("span", { className: "wss-card-title" }, t("mode." + mode)),
            createElement("span", { className: "wss-card-sub" }, sub)),
          introRow(t("kv.why"), t("card." + mode + ".why")),
          introRow(t("kv.how"), t("card." + mode + ".how")),
          introRow(t("kv.what"), t("card." + mode + ".what")),
          createElement("div", { className: "wss-impl" },
            createElement("span", { className: "wss-impl-k" }, t("impl.label")),
            t("card." + mode + ".impl")));
      };
      var renderIntro = function () {
        return createElement("div", { className: "wss-intro" },
          createElement("div", { className: "wss-intro-title" }, t("intro.title")),
          introCard("keyword", t("card.keyword.sub")),
          introCard("codegraph", t("card.codegraph.sub")),
          createElement("div", { className: "wss-intro-foot" }, t("intro.footnote")));
      };

      return createElement("div", { className: "wss-root" },
        createElement("div", { className: "wss-inputrow" },
          createElement("div", { className: "wss-seg" },
            createElement("button", {
              type: "button",
              className: "wss-seg-b" + (!isCg ? " wss-seg-on" : ""),
              onClick: function () { switchMode("keyword"); },
            }, t("mode.keyword")),
            createElement("button", {
              type: "button",
              className: "wss-seg-b" + (isCg ? " wss-seg-on" : ""),
              onClick: function () { switchMode("codegraph"); },
            }, t("mode.codegraph"))),
          createElement("input", {
            className: "wss-input",
            type: "text",
            placeholder: isCg ? t("input.placeholder.cg") : t("input.placeholder"),
            value: query,
            autoFocus: true,
            spellCheck: false,
            onChange: function (e) { setStore({ query: e.target.value }); },
            onKeyDown: function (e) {
              if (e.key === "Enter") submitNow();
              if (e.key === "Escape") setStore({ query: "", result: null, error: null });
            },
          }),
          isCg ? null : createElement("button", {
            type: "button",
            className: "wss-case" + (caseSensitive ? " wss-case-on" : ""),
            title: t("toggle.case"),
            onClick: function () { setStore({ caseSensitive: !caseSensitive }); },
          }, "Aa"),
          isCg ? null : createElement("button", {
            type: "button",
            className: "wss-case" + (regex ? " wss-case-on" : ""),
            title: t("toggle.regex"),
            onClick: function () { setStore({ regex: !regex }); },
          }, ".*"),
          isCg ? null : createElement("button", {
            type: "button",
            className: "wss-case" + (filtersOpen ? " wss-case-on" : ""),
            title: t("toggle.filters"),
            onClick: function () { setStore({ filtersOpen: !filtersOpen }); },
          }, "⌄")),
        filtersOpen && !isCg ? createElement("div", { className: "wss-filters" },
          createElement("input", {
            className: "wss-filter-input",
            type: "text",
            placeholder: t("include.placeholder"),
            value: include,
            spellCheck: false,
            onChange: function (e) { setStore({ include: e.target.value }); },
          }),
          createElement("input", {
            className: "wss-filter-input",
            type: "text",
            placeholder: t("exclude.placeholder"),
            value: exclude,
            spellCheck: false,
            onChange: function (e) { setStore({ exclude: e.target.value }); },
          }),
          createElement("div", { className: "wss-typerow" },
            createElement("span", { className: "wss-typelabel" }, t("filters.types")),
            TYPE_PALETTE.map(function (ext) {
              var on = types.indexOf(ext) !== -1;
              return createElement("button", {
                type: "button",
                key: ext,
                className: "wss-chip" + (on ? " wss-chip-on" : ""),
                title: on ? t("types.clear") : ext,
                "aria-pressed": on ? "true" : "false",
                onClick: function () { toggleType(ext); },
              }, ext);
            })),
          createElement("input", {
            className: "wss-filter-input",
            type: "text",
            placeholder: t("types.placeholder"),
            value: typesInput,
            spellCheck: false,
            onChange: function (e) { setStore({ typesInput: e.target.value, types: parseTypes(e.target.value) }); },
          })) : null,
        createElement("div", { className: "wss-status" },
          busy ? (result !== null && result.streaming === true && result.results.length > 0
            ? t("status.streaming", { files: result.results.length, matches: totalMatches })
            : t("status.searching"))
            : error !== null ? t("status.error", { message: error.message })
              : result === null ? (cwd ? t("status.scope", { path: cwd }) : t("status.noWorkspace"))
                : isCg ? t("status.symbols", { count: result.results.length })
                  : result.error === "invalid-regex" ? t("status.invalidRegex")
                    : t("status.results", { files: result.results.length, matches: totalMatches })
                      + (result.typeSkipped ? t("status.typeSkipped", { count: result.typeSkipped }) : "")
                      + (result.truncatedFiles ? t("status.truncFiles") : "")
                      + (result.truncatedMatches ? t("status.truncMatches") : "")),
        createElement("div", {
          className: "wss-results",
          ref: resultsRef,
          onScroll: function (e) { resultsScrollTop = e.currentTarget.scrollTop; },
        },
          cgFail !== null ? createElement("div", { className: "wss-errblock" },
            createElement("div", { className: "wss-errmsg" },
              t("cg.error." + error.code.slice(10))
              + (error.code === "codegraph-failed" ? "：" + error.message : "")),
            error.details.command !== undefined && error.details.command !== ""
              ? createElement("div", { className: "wss-errhint" },
                error.code === "codegraph-not-initialized" ? t("cg.init.hint") : null,
                createElement("div", { className: "wss-code" },
                  createElement("code", null, error.details.command),
                  createElement("button", {
                    type: "button",
                    className: "wss-copybtn",
                    onClick: function () { copyInit(error.details.command); },
                  }, copied ? t("cg.copied") : t("cg.copy"))))
              : null)
            // Rows appear as soon as the stream has produced any, even while the
            // walk is still running; only an in-flight search with nothing yet
            // (or an empty finished one) shows no rows.
            : result !== null && result.results.length > 0 ? (isCg ? result.results.map(renderSymbol) : result.results.map(renderFile))
              : busy ? null
                : result !== null ? createElement("div", { className: "wss-empty" }, t("empty"))
                  : error === null ? renderIntro() : null));
    }

    /**
     * Client plugin body: register the tab type, its guide entry, its
     * dictionaries, its pane body, and the panel stylesheet.
     * @param ctx - client root context carrying the registry, the seats, and the locale service.
     */
    function apply(ctx) {
      wire.call = function (channel, endpoint, payload) {
        // The web GUI reaches the host through the plugin's webServer route
        // (same pattern dsh-taskboard uses). connection.rpc.call cannot work:
        // dsh-client-connection POSTs the raw "<channel>/<endpoint>" path,
        // which the SPA fallback answers with HTTP 405.
        return fetch(channel + "/" + endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }).then(function (response) {
          if (!response.ok) throw new Error("transport failure for " + channel + "/" + endpoint + ": HTTP " + response.status);
          return response.json();
        });
      };
      /**
       * POST a request and consume an NDJSON response, handing every result
       * group to \`onGroup\` as it arrives over the wire and resolving with the
       * final summary. A single JSON envelope (validation error, or a host build
       * from before streaming) is normalized onto the same path.
       */
      wire.stream = function (channel, endpoint, payload, onGroup) {
        return fetch(channel + "/" + endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }).then(function (response) {
          if (!response.ok) throw new Error("transport failure for " + channel + "/" + endpoint + ": HTTP " + response.status);
          var type = response.headers !== undefined && response.headers !== null && typeof response.headers.get === "function"
            ? response.headers.get("content-type") || ""
            : "";
          if (type.indexOf("application/x-ndjson") === -1) {
            return response.json().then(function (envelope) {
              if (!envelope.ok) throw errorFrom(envelope);
              envelope.value.results.forEach(onGroup);
              return envelope.value;
            });
          }
          return readNdjsonStream(response, onGroup);
        });
      };
      var t = ctx.locale.bind(NS);
      ctx.effect(mountStyle, "code-search: stylesheet");
      ctx.effect(function () {
        return ctx.locale.register(NS, { zh: zh, en: en });
      }, "code-search: dictionaries");
      ctx.effect(function () {
        return ctx.sidebarRightTabs.register({
          id: ID,
          kind: KIND,
          title: function () { return t("type.label"); },
          guide: [{
            id: "code-search",
            order: 40,
            title: function () { return t("guide.title"); },
            description: function () { return t("guide.description"); },
            icon: UiPrimitives.PluginArtworkSearch,
          }],
        });
      }, "code-search: tab type");
      ctx.effect(function () {
        return ctx.slots.inject("sidebar.right.pane.tab", function () {
          return ctx.slots.register({
            name: "sidebar.right.pane.tab",
            key: ID,
            locale: NS,
          }, SearchBody);
        });
      }, "code-search: tab body");
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
