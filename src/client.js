// dsh-facet-cards - client half.
//
// A self-adaptive card switcher: a slot that hands over a `sessionId` switches
// that session's card, a slot that does not switches the global default. The
// same component serves both surfaces; `switcherMode` makes the choice explicit
// and testable.
//
// The module is a classic client bundle (client-modules protocol): it registers
// a factory with window.__ModuleLoader__ and returns apply(). `react` is a
// platform module (packages/client/web/src/platform.ts), seeded into the frozen
// module table before any bundle materializes, so it needs no `dsh.client.inject`
// edge. Everything else is read through ctx.get() with an absence check.
window.__ModuleLoader__.load({
  id: 'dsh-facet-cards',
  factory: (require) => {
    const react = require('react')

    // A package whose client half cannot be required takes the whole module
    // down, and an unregistered specifier throws on the spot rather than
    // returning undefined. So the lookup is guarded, and the switcher falls
    // back to a plain select when the primitives are not where this build
    // expects them - a plain control beats a broken client.
    let primitives
    try {
      primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    } catch {
      primitives = undefined
    }
    const Menu = primitives?.Menu
    const Pill = primitives?.Pill
    // The dock picker portals its panel to document.body so the host's
    // transformed ancestors cannot become its containing block; a build
    // without react-dom falls back to rendering in place.
    let ReactDOM
    try {
      ReactDOM = require('react-dom')
    } catch {
      ReactDOM = undefined
    }
    const ChevronIcon = primitives?.IconChevronDownOutline14
      ?? primitives?.IconChevronDownOutlineMedium
      ?? primitives?.IconChevronDownOutlineRegular
    // forwardRef() and memo() components are objects, not functions. Testing
    // typeof === 'function' would call a perfectly good Button "missing".
    const isPrimitive = (component) => component !== undefined && component !== null
    const canUseMenu = isPrimitive(Menu) && isPrimitive(Pill)

    // One stylesheet for both surfaces. The module system runs the factory
    // body at materialization, so a guarded append is the plugin-owned way to
    // ship presentation without a build step. Every rule is prefixed dshfc-.
    const STYLE_ID = 'dsh-facet-cards-style'
    const STYLES = `
.dshfc-root{display:flex;flex-direction:column;gap:16px;max-width:760px;font-size:var(--dsh-content-font-size,14px);line-height:1.5;color:var(--dsw-alias-label-primary)}
.dshfc-muted{margin:0;font-size:13px;color:var(--dsw-alias-label-tertiary)}
.dshfc-spacer{flex:1 1 auto}
.dshfc-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dshfc-card{display:flex;flex-direction:column;gap:12px;padding:14px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}
.dshfc-list{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.dshfc-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-layer-1);transition:background 120ms ease,border-color 120ms ease}
.dshfc-row:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l4)}
.dshfc-name{padding:0;border:none;background:none;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;font-weight:600;text-align:left;cursor:pointer}
.dshfc-name:hover{color:var(--dsw-alias-link)}
.dshfc-meta{font-size:12px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.dshfc-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
.dshfc-chip{display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;white-space:nowrap}
.dshfc-group{border:0.5px solid var(--dsw-alias-border-l3);border-radius:14px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;transition:border-color 120ms ease}
.dshfc-group[data-open]{border-color:var(--dsw-alias-border-l4)}
.dshfc-grouphead{display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;border:none;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dshfc-grouphead:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshfc-grouptext{display:flex;flex-direction:column;gap:2px;min-width:0}
.dshfc-chevron{display:inline-flex;align-items:center;justify-content:center;flex:none;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);transition:transform 160ms ease}
.dshfc-chevron[data-open]{transform:rotate(180deg)}
.dshfc-chevronshape{display:block;width:7px;height:7px;margin-top:-3px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg)}
.dshfc-grouptitle{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dshfc-badge{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dshfc-groupbody{display:flex;flex-direction:column;gap:14px;padding:14px 16px 16px;border-top:0.5px solid var(--dsw-alias-border-l2)}
.dshfc-field{display:flex;flex-direction:column;gap:6px}
.dshfc-label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.dshfc-inputwrap{display:flex;width:100%}
.dshfc-rowline{display:flex;align-items:center;gap:8px}
.dshfc-callout{padding:10px 12px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-layer-2);font-size:13px;color:var(--dsw-alias-label-secondary)}
.dshfc-callout[data-tone="error"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-error)}
.dshfc-warning{margin-top:4px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dshfc-empty{padding:20px 16px;border:0.5px dashed var(--dsw-alias-border-l3);border-radius:12px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px}
.dshfc-thumb{width:34px;height:34px;border-radius:8px;object-fit:cover;flex:none;background:var(--dsw-alias-bg-layer-2)}
.dshfc-glyph{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;flex:none;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:15px;font-weight:600}
.dshfc-chiprow{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.dshfc-chipbtn{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:12px;border:0.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;white-space:nowrap}
.dshfc-chipbtn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshfc-chipbtn[data-on]{border-color:var(--dsw-alias-border-l4);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}
.dshfc-imagerow{display:flex;align-items:center;gap:10px}
.dshfc-imgprev{width:64px;height:64px;border-radius:10px;object-fit:cover;border:0.5px solid var(--dsw-alias-border-l3);flex:none}
/* Dock 式选择面板：portal 到 body 的固定定位浮层，横向铺开、可换行。 */
.dshfc-dock{position:fixed;z-index:99999;display:flex;flex-direction:column;gap:8px;padding:12px;border:0.5px solid var(--dsw-alias-border-l4);border-radius:16px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 12px 32px rgba(0,0,0,.25);overflow:auto;box-sizing:border-box}
.dshfc-dockhead{display:flex;align-items:center;gap:8px;padding:0 2px}
.dshfc-docktitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-tertiary)}
.dshfc-dockgrid{display:flex;flex-wrap:wrap;gap:6px}
.dshfc-tile{display:flex;flex-direction:column;align-items:center;gap:4px;width:88px;padding:8px 4px 6px;border-radius:12px;border:0.5px solid transparent;background:none;cursor:pointer}
.dshfc-tile:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}
.dshfc-tile[data-on]{border-color:var(--dsw-alias-border-l4);background:var(--dsw-alias-interactive-bg-hover)}
.dshfc-tileimg{width:44px;height:44px;border-radius:10px;object-fit:cover}
.dshfc-tileglyph{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:19px;font-weight:600}
.dshfc-tilelabel{max-width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-primary);text-align:center}
.dshfc-tilemeta{font-size:10px;color:var(--dsw-alias-label-tertiary)}
`

    if (typeof document !== 'undefined') {
      const existing = document.getElementById(STYLE_ID)
      if (existing === null) {
        const style = document.createElement('style')
        style.id = STYLE_ID
        style.textContent = STYLES
        style.dataset.pluginCss = 'dsh-facet-cards'
        document.head.appendChild(style)
      } else if (existing.textContent !== STYLES) {
        // HMR rematerializes the factory; refresh, don't duplicate.
        existing.textContent = STYLES
      }
    }

    /** A chevron that needs no icon export, so it survives icon-set renames. */
    function Chevron({ open }) {
      return react.createElement(
        'span',
        { className: 'dshfc-chevron', 'data-open': open ? '' : undefined, 'aria-hidden': true },
        react.createElement('span', { className: 'dshfc-chevronshape' }),
      )
    }

    /** Label above a control, with optional helper text. */
    function Field({ label, hint, children }) {
      return react.createElement(
        'div',
        { className: 'dshfc-field' },
        react.createElement('span', { className: 'dshfc-label' }, label),
        children,
        hint === undefined ? null : react.createElement('span', { className: 'dshfc-meta' }, hint),
      )
    }

    // Editor primitives. Looked up the same guarded way as the switcher's:
    // an undefined component handed to react.createElement throws, so the
    // settings page checks these before it renders anything and degrades to a
    // message when the build does not export them.
    const Input = primitives?.Input
    const Button = primitives?.Button

    const ROUTE = '/dsh-facet-cards'

    /**
     * Read a nested field without throwing on a missing parent.
     * @param card - the card.
     * @param path - dot-separated field path.
     * @returns the value, or undefined.
     */
    function fieldOf(card, path) {
      let cursor = card
      for (const part of path.split('.')) {
        if (cursor === null || typeof cursor !== 'object') return undefined
        cursor = cursor[part]
      }
      return cursor
    }

    /**
     * Return a copy of a card with one nested field replaced.
     *
     * The copy comes from structuredClone and only the named path is assigned,
     * so every field this build does not know survives (GOAL D6). Rebuilding
     * the card from a field list would silently delete them on the first save.
     * @param card - the card to copy.
     * @param path - dot-separated field path.
     * @param value - the replacement value.
     * @returns a new card.
     */
    function withField(card, path, value) {
      const parts = path.split('.')
      const copy = structuredClone(card)
      let cursor = copy
      for (const part of parts.slice(0, -1)) {
        if (cursor[part] === null || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
          cursor[part] = {}
        }
        cursor = cursor[part]
      }
      cursor[parts[parts.length - 1]] = value
      return copy
    }

    /**
     * Coerce any string into a valid card id.
     * @param value - the requested id.
     * @returns a lowercase, hyphen-separated id of at most 64 characters.
     */
    function sanitizeCardId(value) {
      const cleaned = String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const truncated = cleaned.slice(0, 64).replace(/-+$/g, '')
      return truncated.length === 0 ? 'imported-card' : truncated
    }

    /**
     * First free id derived from a base.
     * @param base - the preferred id.
     * @param ids - ids already taken.
     * @returns a valid, unused id.
     */
    function uniqueCardId(base, ids) {
      const taken = new Set(ids)
      const root = sanitizeCardId(base)
      if (!taken.has(root)) return root
      for (let n = 2; ; n += 1) {
        const suffix = `-${n}`
        const stem = root.slice(0, 64 - suffix.length).replace(/-+$/g, '')
        const candidate = `${stem}${suffix}`
        if (!taken.has(candidate)) return candidate
      }
    }

    /**
     * Prepare a parsed .dshcd for the create route.
     *
     * The host write route accepts v1 only. Restamping an unfamiliar version is
     * how "accept with a warning" is implemented without weakening every other
     * reader; every unknown field still survives.
     * @param card - the parsed object.
     * @param ids - ids already taken.
     * @returns `{ card, renamed, versionWarning }`.
     */
    function prepareImport(card, ids) {
      const copy = structuredClone(card)
      const original = copy.id
      const id = uniqueCardId(sanitizeCardId(original), ids)
      copy.id = id
      const versionWarning = copy.dshcd !== 1
      if (versionWarning) copy.dshcd = 1
      return { card: copy, renamed: id !== original, versionWarning }
    }

    /**
     * The five editable groups, in render order, with their D2 impact badges.
     *
     * `kind` decides the control: `text` is one Input, `list` is a row per
     * entry, `bool` is a Pill toggle.
     * @returns the group descriptors.
     */
    function editorGroups() {
      return [
        {
          key: 'identity',
          title: '身份',
          badge: '低风险 · 影响视角与用词',
          fields: [
            {
              path: 'identity.role',
              label: '角色',
              kind: 'text',
              help: '写一句它是谁，决定它怎么理解任务。',
              placeholder: '例如：耐心的代码导师',
            },
            {
              path: 'identity.expertise',
              label: '专长',
              kind: 'list',
              help: '它特别擅长的领域，每行一个。',
              placeholder: '例如：TypeScript',
            },
            {
              path: 'identity.background',
              label: '背景',
              kind: 'text',
              help: '影响它举例和类比的经历。',
              placeholder: '例如：十年后端经验，带过新人',
            },
          ],
        },
        {
          key: 'voice',
          title: '表达',
          badge: '安全 · 只影响表达，不影响正确性',
          fields: [
            {
              path: 'voice.tone',
              label: '语气',
              kind: 'text',
              help: '整体语气。',
              placeholder: '例如：平静、直接',
            },
            {
              path: 'voice.verbosity',
              label: '篇幅',
              kind: 'text',
              help: '回答的详细程度。',
              placeholder: '例如：简短，先给结论',
            },
            {
              path: 'voice.formality',
              label: '正式度',
              kind: 'text',
              help: '正式还是口语化。',
              placeholder: '例如：口语化，不用敬语',
            },
            {
              path: 'voice.humor',
              label: '幽默',
              kind: 'text',
              help: '什么时候开玩笑、开多大；不想幽默就写“不幽默”。',
              placeholder: '例如：偶尔冷幽默，不拿用户开玩笑',
            },
            {
              path: 'voice.traits',
              label: '性格',
              kind: 'list',
              help: '性格特征，每行一个。',
              placeholder: '例如：耐心',
            },
            {
              path: 'voice.avoid',
              label: '禁止',
              kind: 'list',
              help: '明确禁止的表达，每行一个。',
              placeholder: '例如：emoji',
            },
          ],
        },
        {
          key: 'code',
          title: '代码风格',
          badge: '会改变代码 · 影响产出质量与风格',
          fields: [
            {
              path: 'code.naming',
              label: '命名',
              kind: 'text',
              help: '变量和函数怎么命名。',
              placeholder: '例如：描述性命名，不用缩写',
            },
            {
              path: 'code.comments',
              label: '注释',
              kind: 'text',
              help: '什么时候写注释。',
              placeholder: '例如：只解释不明显的决定',
            },
            {
              path: 'code.error_handling',
              label: '错误处理',
              kind: 'text',
              help: '出错时怎么处理。',
              placeholder: '例如：显式返回错误，不吞异常',
            },
            {
              path: 'code.abstraction',
              label: '抽象',
              kind: 'text',
              help: '抽象到什么程度。',
              placeholder: '例如：三行重复再抽函数',
            },
            {
              path: 'code.dependencies',
              label: '依赖',
              kind: 'text',
              help: '能不能新增依赖。',
              placeholder: '例如：优先标准库，新增依赖先问',
            },
            {
              path: 'code.tests',
              label: '测试',
              kind: 'text',
              help: '测试怎么写。',
              placeholder: '例如：测行为，不测 mock',
            },
            {
              path: 'code.commit_style',
              label: '提交信息',
              kind: 'text',
              help: '提交信息怎么写。',
              placeholder: '例如：Conventional Commits',
            },
          ],
        },
        {
          key: 'workflow',
          title: '工作方式',
          badge: '高风险 · 影响行为决策',
          fields: [
            {
              path: 'workflow.plan',
              label: '计划',
              kind: 'text',
              help: '复杂任务开始前怎么规划。',
              placeholder: '例如：先列步骤再动手',
            },
            {
              path: 'workflow.ask_when_unclear',
              label: '需求不清就问',
              kind: 'bool',
              help: '不确定时先问，而不是猜。',
            },
            {
              path: 'workflow.verify_before_claim',
              label: '完成前先验证',
              kind: 'bool',
              help: '说“完成”之前先跑验证。',
            },
          ],
        },
        {
          key: 'constraints',
          title: '硬性约束',
          badge: '最高优先级 · 逐条遵守',
          fields: [
            {
              path: 'constraints',
              label: '约束',
              kind: 'list',
              help: '绝对不能违反的规则，每行一条，优先级最高。',
              placeholder: '例如：先给结论',
            },
          ],
        },
      ]
    }

    /** Recursively sort object keys so two structurally equal cards compare equal. */
    function canonical(value) {
      if (Array.isArray(value)) return value.map(canonical)
      if (value !== null && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
      }
      return value
    }

    /**
     * Whether a draft differs from what was loaded.
     * @param draft - the edited card.
     * @param original - the loaded card, or null for a new one.
     * @returns true when saving would change something.
     */
    function isDirty(draft, original) {
      if (original === null) return draft !== null
      return JSON.stringify(canonical(draft)) !== JSON.stringify(canonical(original))
    }

    /**
     * Which surface a switcher instance is: a slot that hands over a sessionId
     * switches that session, a slot that does not switches the global default.
     * @param props - the slot's props.
     * @returns the mode.
     */
    function switcherMode(props) {
      return typeof props?.sessionId === 'string' && props.sessionId.length > 0 ? 'session' : 'global'
    }

    /** GET JSON, returning undefined instead of throwing. */
    async function getJson(path) {
      try {
        const res = await fetch(`${ROUTE}${path}`)
        if (!res.ok) return undefined
        return await res.json()
      } catch {
        return undefined
      }
    }

    /**
     * POST JSON.
     * @param path - route path, below the plugin's prefix.
     * @param body - the JSON body.
     * @returns the parsed body; on a non-2xx status the body's own error fields
     *   are kept with `ok: false` forced, so callers can say why. Undefined only
     *   when the request itself failed.
     *
     * The distinction matters: a 409 from `POST /cards` carries `code: 'exists'`
     * and a sentence a user can act on, and collapsing every non-2xx into
     * undefined would leave the editor showing a bare "保存失败" for a problem
     * the host already described. Callers that only care about success test
     * `ok`, which the forced field keeps honest for a body that omitted it.
     */
    async function postJson(path, body) {
      try {
        const res = await fetch(`${ROUTE}${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        const payload = await res.json().catch(() => ({}))
        if (res.ok) return payload
        return { ok: false, code: payload.code ?? 'http', error: payload.error ?? `HTTP ${res.status}` }
      } catch {
        return undefined
      }
    }

    /** PUT JSON, with the same error shape as postJson. */
    async function putJson(path, body) {
      try {
        const res = await fetch(`${ROUTE}${path}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        const payload = await res.json().catch(() => ({}))
        if (res.ok) return payload
        return { ok: false, code: payload.code ?? 'http', error: payload.error ?? `HTTP ${res.status}` }
      } catch {
        return undefined
      }
    }

    /** DELETE JSON, with the same error shape as postJson. */
    async function deleteJson(path) {
      try {
        const res = await fetch(`${ROUTE}${path}`, { method: 'DELETE' })
        const payload = await res.json().catch(() => ({}))
        if (res.ok) return payload
        return { ok: false, code: payload.code ?? 'http', error: payload.error ?? `HTTP ${res.status}` }
      } catch {
        return undefined
      }
    }

    /**
     * Which option a switcher shows before the user touches it.
     *
     * Option values are namespaced - `card:<id>`, `none`, `default` - so a card
     * whose id happens to read "none" still gets its own option.
     *
     * The two modes answer different questions. Global mode only ever picks a
     * card, so it shows the current default. Session mode has three answers:
     * a pinned card, no card at all, or follow the default - and the last two
     * are distinct even though both leave `cardId` reporting the default.
     * @param mode - `'session'` or `'global'`.
     * @param cards - the `/cards` payload.
     * @param session - the `/session/<id>` payload, or undefined in global mode.
     * @returns the value to select.
     */
    function initialSelection(mode, cards, session) {
      if (mode === 'global') return cards?.defaultCard ? `card:${cards.defaultCard}` : ''
      if (session === undefined || !Object.hasOwn(session, 'override')) return 'default'
      return session.override === null ? 'none' : `card:${session.override}`
    }

    /**
     * Keep a selection across a list refresh when it still exists.
     * @param entries - the refreshed options.
     * @param previousValue - the value before the refresh.
     * @param computedValue - the value the host state would choose.
     * @returns the previous value when it is still offered, else the computed one.
     */
    function nextSelection(entries, previousValue, computedValue) {
      return entries.some(entry => entry.id === previousValue) ? previousValue : computedValue
    }

    /**
     * One editable field.
     * @param props.draft - the card.
     * @param props.field - `{ path, label, kind }` from editorGroups().
     * @param props.onChange - called with the next card.
     */
    function EditorField({ draft, field, onChange }) {
      const value = fieldOf(draft, field.path)

      if (field.kind === 'bool') {
        return react.createElement(
          'div',
          { className: 'dshfc-field' },
          react.createElement(
            'div',
            { className: 'dshfc-rowline' },
            react.createElement(Pill, {
              active: value === true,
              onClick: () => onChange(withField(draft, field.path, value !== true)),
            }, value === true ? '已开启' : '已关闭'),
            react.createElement('span', { className: 'dshfc-label' }, field.label),
          ),
          field.help === undefined
            ? null
            : react.createElement('span', { className: 'dshfc-meta' }, field.help),
        )
      }

      if (field.kind === 'list') {
        const entries = Array.isArray(value) ? value : []
        const replace = (index, next) => {
          const copy = entries.slice()
          if (next === undefined) copy.splice(index, 1)
          else copy[index] = next
          onChange(withField(draft, field.path, copy))
        }
        return react.createElement(
          Field,
          { label: field.label, hint: field.help },
          entries.length === 0
            ? react.createElement('span', { className: 'dshfc-meta' }, '暂无条目')
            : entries.map((entry, index) => react.createElement(
                'div',
                { key: String(index), className: 'dshfc-rowline' },
                react.createElement(Input, {
                  className: 'dshfc-inputwrap',
                  placeholder: field.placeholder,
                  value: String(entry),
                  onChange: (event) => replace(index, event.target.value),
                }),
                react.createElement(Button, {
                  size: 'sm',
                  variant: 'outline',
                  onClick: () => replace(index, undefined),
                }, '删除'),
              )),
          react.createElement(Button, {
            size: 'sm',
            variant: 'outline',
            onClick: () => onChange(withField(draft, field.path, [...entries, ''])),
          }, `添加${field.label}`),
        )
      }

      return react.createElement(
        Field,
        { label: field.label, hint: field.help },
        react.createElement(Input, {
          className: 'dshfc-inputwrap',
          placeholder: field.placeholder,
          value: typeof value === 'string' ? value : '',
          onChange: (event) => onChange(withField(draft, field.path, event.target.value)),
        }),
      )
    }

    /**
     * One collapsible group of fields.
     * @param props.group - from editorGroups().
     * @param props.draft - the card.
     * @param props.open - whether the group is expanded.
     * @param props.onToggle - expand/collapse.
     * @param props.onChange - called with the next card.
     */
    function EditorGroup({ group, draft, open, onToggle, onChange }) {
      return react.createElement(
        'section',
        { className: 'dshfc-group', 'data-open': open ? '' : undefined },
        react.createElement(
          'button',
          {
            type: 'button',
            className: 'dshfc-grouphead',
            'aria-expanded': open,
            onClick: onToggle,
          },
          react.createElement(Chevron, { open }),
          react.createElement(
            'span',
            { className: 'dshfc-grouptext' },
            react.createElement('span', { className: 'dshfc-grouptitle' }, group.title),
            react.createElement('span', { className: 'dshfc-badge' }, group.badge),
          ),
        ),
        open
          ? react.createElement(
              'div',
              { className: 'dshfc-groupbody' },
              group.fields.map(field => react.createElement(EditorField, {
                key: field.path,
                draft,
                field,
                onChange,
              })),
            )
          : null,
      )
    }

    /**
     * The identity card: id (create-only), name, and description.
     *
     * The id is the file name and the sessions' pointer to it, so renaming an
     * existing card would either orphan its file or leave the sessions that
     * reference it pointing at nothing. A new card picks its own id; after that
     * it is shown read-only.
     */
    function cardMetaFields(view, onChange) {
      return react.createElement(
        'div',
        { className: 'dshfc-card' },
        view.original === null
          ? react.createElement(
              Field,
              { label: 'ID', hint: '小写字母、数字、连字符；创建后不可更改' },
              react.createElement(Input, {
                className: 'dshfc-inputwrap',
                value: view.draft.id ?? '',
                placeholder: '例如 patient-teacher',
                onChange: (event) => onChange(withField(view.draft, 'id', event.target.value)),
              }),
            )
          : react.createElement(
              Field,
              { label: 'ID' },
              react.createElement('span', { className: 'dshfc-chip' }, view.draft.id),
            ),
        react.createElement(
          Field,
          { label: '名称' },
          react.createElement(Input, {
            className: 'dshfc-inputwrap',
            value: view.draft.name ?? '',
            placeholder: '给这张卡起个名字',
            onChange: (event) => onChange(withField(view.draft, 'name', event.target.value)),
          }),
        ),
        // Metadata only - `renderCard` never reads it, but it is part of the
        // format and the library summary carries it.
        react.createElement(
          Field,
          { label: '描述', hint: '仅用于卡片列表，不会进入提示词' },
          react.createElement(Input, {
            className: 'dshfc-inputwrap',
            value: view.draft.description ?? '',
            placeholder: '一句话说明这张卡的用途',
            onChange: (event) => onChange(withField(view.draft, 'description', event.target.value)),
          }),
        ),
        react.createElement(
          Field,
          { label: '分类', hint: '自由填写，如：视角 / 写作 / 顾问；列表和选择面板按它筛选' },
          react.createElement(Input, {
            className: 'dshfc-inputwrap',
            value: view.draft.category ?? '',
            placeholder: '例如：视角',
            onChange: (event) => onChange(withField(view.draft, 'category', event.target.value)),
          }),
        ),
        react.createElement(
          Field,
          { label: '图片路径', hint: '本机图片绝对路径（png/jpg/webp/gif），如 D:\\pic\\a.png；保存后生效' },
          react.createElement(Input, {
            className: 'dshfc-inputwrap',
            value: view.draft.image ?? '',
            placeholder: '例如 D:\\pic\\aristotle.png',
            onChange: (event) => onChange(withField(view.draft, 'image', event.target.value)),
          }),
        ),
        // A saved card can fetch its image through the host's /images route -
        // the renderer cannot open file: URLs itself. A new card has no id to
        // fetch under yet, so the preview waits for the first save.
        view.original === null || (view.draft.image ?? '') === ''
          ? null
          : react.createElement(
              'div',
              { className: 'dshfc-imagerow', key: 'imgprev' },
              react.createElement('img', {
                className: 'dshfc-imgprev',
                src: `${ROUTE}/images/${encodeURIComponent(view.draft.id)}?t=${encodeURIComponent(view.draft.image)}`,
                alt: '卡片图片预览',
                onError: (event) => { event.target.style.display = 'none' },
                onLoad: (event) => { event.target.style.display = '' },
              }),
              react.createElement('span', { className: 'dshfc-meta' },
                '读不到图时检查路径是否正确、文件是否还在。'),
            ),
      )
    }

    /** Size and D5 advisories.
     *
     * `preview.error` covers both a transport failure and a card the host
     * rejected, because the host puts its reason there in either case. The
     * contract marks it optional, so a `valid: false` answer without one must
     * still say something rather than render an empty line.
     *
     * A pristine new card is invalid by definition (no id yet). Showing that
     * as an error the moment the editor opens reads as a failure the user
     * caused; validation speaks only after the first edit.
     */
    function previewPanel(preview, touched) {
      if (preview.status === 'idle') return null
      if (preview.status === 'error') {
        return react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' }, preview.error)
      }
      if (preview.valid !== true) {
        if (!touched) return null
        return react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' },
          preview.error ?? '卡片无效')
      }
      return react.createElement('div', { className: 'dshfc-callout' },
        react.createElement('div', null, `${preview.tokens} token · ${preview.chars} 字符`),
        (preview.warnings ?? []).map(warning =>
          react.createElement('div', { key: warning.code, className: 'dshfc-warning' }, `⚠ ${warning.message}`)),
      )
    }

    /**
     * One card being edited.
     *
     * The preview is debounced because it round-trips to the host, which owns
     * the format rules; the client never renders a second time to guess what a
     * card costs. The effect keys on `view.draft`, a fresh object on every edit,
     * so each keystroke clears the pending timer before it fires; the `cancelled`
     * flag then discards a reply that was already in flight when the next edit
     * landed, which is what keeps a slow host from showing one keystroke's size
     * for the next keystroke's card.
     *
     * The draft is editable even while invalid - the host explains what is wrong
     * and the user fixes it in place - but saving waits for `valid`.
     *
     * Saving is not applying: a save only lands on disk, and a session picks the
     * new version up on its next turn. Pushing it into running sessions is the
     * separate, deliberate press in the list row.
     * @param props.view - `{ draft, original }`.
     * @param props.onChange - called with the next draft.
     * @param props.onClose - return to the list, reloading it.
     */
    function CardEditor({ view, onChange, onClose }) {
      const [openGroup, setOpenGroup] = react.useState('identity')
      const [preview, setPreview] = react.useState({ status: 'idle' })
      const [saveError, setSaveError] = react.useState(null)
      const [confirmDiscard, setConfirmDiscard] = react.useState(false)
      // A new card starts invalid (no id yet). Until the first edit, the
      // editor must not present that as a failure the user caused.
      const [touched, setTouched] = react.useState(false)

      const dirty = isDirty(view.draft, view.original)
      const changed = touched && dirty

      react.useEffect(() => {
        let cancelled = false
        const handle = setTimeout(async () => {
          const answer = await postJson('/cards/preview', { card: view.draft })
          if (cancelled) return
          setPreview(answer === undefined
            ? { status: 'error', error: '无法连接宿主' }
            : { status: 'ready', ...answer })
        }, 300)
        return () => { cancelled = true; clearTimeout(handle) }
      }, [view.draft])

      const valid = preview.status === 'ready' && preview.valid === true
      const canSave = valid

      // A failed save leaves its message on screen until the next save clears
      // it - so once the user has fixed the cause, the stale message still
      // sits there claiming the card is unsavable. Clearing on every draft
      // edit removes it the moment they act. Wrapped around the edit path
      // rather than added as an effect on `view.draft`, because an effect
      // would also fire on re-renders that are not edits.
      const editDraft = (draft) => {
        setTouched(true)
        setSaveError(null)
        onChange(draft)
      }

      const save = async () => {
        setTouched(true)
        setSaveError(null)
        const isNew = view.original === null
        const path = isNew ? '/cards' : `/cards/${encodeURIComponent(view.draft.id)}`
        const answer = await (isNew ? postJson(path, { card: view.draft }) : putJson(path, { card: view.draft }))
        if (answer === undefined || answer.ok !== true) {
          setSaveError(answer?.error ?? '保存失败')
          return
        }
        onClose()
      }

      // Two clicks, no modal: a confirmation dialog interrupts for a decision
      // the button itself can express, so the first press turns the button into
      // the confirmation and the second discards. The flag is not reset by later
      // edits - once the user has asked to leave, they are one press away from
      // doing so, and re-arming on every keystroke would only add clicks.
      const leave = () => {
        if (!changed) { onClose(); return }
        if (!confirmDiscard) { setConfirmDiscard(true); return }
        onClose()
      }

      const groups = editorGroups()

      return react.createElement(
        'div',
        { className: 'dshfc-root' },
        react.createElement(
          'div',
          { className: 'dshfc-toolbar' },
          react.createElement(Button, { variant: 'outline', onClick: leave },
            changed ? (confirmDiscard ? '确认放弃？' : '放弃修改') : '返回'),
          react.createElement('span', { className: 'dshfc-spacer' }),
          react.createElement(Button, {
            variant: 'primary',
            title: canSave ? '保存到卡片库' : '卡片无效，修正后即可保存',
            onClick: () => { void save() },
            disabled: !canSave,
          }, '保存'),
        ),
        saveError === null
          ? null
          : react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' }, saveError),
        cardMetaFields(view, editDraft),
        groups.map(group => react.createElement(EditorGroup, {
          key: group.key,
          group,
          draft: view.draft,
          open: openGroup === group.key,
          onToggle: () => setOpenGroup(previous => (previous === group.key ? null : group.key)),
          onChange: editDraft,
        })),
        previewPanel(preview, touched),
      )
    }

    /**
     * The settings page: a card list, and an editor for one card.
     *
     * Only two views exist, so there is no routing, no modal, and no scroll
     * management - the two states are mutually exclusive.
     * @returns {unknown} the section element.
     */
    function CardSettingsSection() {
      const [state, setState] = react.useState({ status: 'loading', cards: [], defaultCard: null })
      const [view, setView] = react.useState({ kind: 'list' })
      const [defaultOpen, setDefaultOpen] = react.useState(false)
      // A failed re-apply used to be invisible: the button awaited the request
      // and reloaded the list regardless, so a host error vanished. One message,
      // cleared by the next success - not a notification system.
      const [applyError, setApplyError] = react.useState(null)
      const [openError, setOpenError] = react.useState(null)
      const [notice, setNotice] = react.useState(null)
      const [menuFor, setMenuFor] = react.useState(null)
      const [confirmDelete, setConfirmDelete] = react.useState(null)
      // View state (sorting and filtering) lives with the other hooks: they
      // must be called on every render, including the loading one.
      const [sortBy, setSortBy] = react.useState('usage-desc')
      const [catFilter, setCatFilter] = react.useState('all')
      const fileInput = react.useRef(null)

      // `reload` takes an optional "still mounted" predicate so the mount
      // effect can discard a response that lands after unmount rather than
      // calling setState on a dead component. Callers that run while mounted -
      // after an apply, or on close - pass nothing.
      const reload = async (stillMounted) => {
        const payload = await getJson('/cards')
        if (stillMounted !== undefined && !stillMounted()) return
        setState(payload === undefined
          ? { status: 'error', cards: [], defaultCard: null }
          : {
              status: 'ready',
              cards: Array.isArray(payload.cards) ? payload.cards : [],
              defaultCard: payload.defaultCard ?? null,
            })
      }

      react.useEffect(() => {
        let mounted = true
        void reload(() => mounted)
        return () => { mounted = false }
      }, [])

      const openEditor = async (cardId) => {
        setConfirmDelete(null)
        setOpenError(null)
        const payload = cardId === undefined ? undefined : await getJson(`/cards/${encodeURIComponent(cardId)}`)
        if (cardId !== undefined && payload === undefined) {
          // A row whose card cannot be loaded would otherwise be a silent no-op,
          // which is the worst shape a failure can take: the user cannot tell
          // whether the click missed or the card is broken. The likeliest cause
          // is a file removed or renamed outside the editor.
          setOpenError(`无法打开「${cardId}」：卡片文件可能已被外部删除或改名。`)
          return
        }
        const original = payload === undefined ? null : payload.card
        setView({
          kind: 'editor',
          original,
          draft: original === null ? { dshcd: 1, id: '', name: '', description: '' } : structuredClone(original),
        })
      }

      // The surfaces are built from these atoms. A build that does not export
      // them gets a message instead of an undefined component (which would
      // throw out of render). forwardRef/memo components are objects, so the
      // presence check must not test typeof.
      const missingPrimitives = [Menu, Pill, Input, Button]
        .some(component => !isPrimitive(component))

      if (state.status === 'loading') return react.createElement('p', { className: 'dshfc-muted' }, '读取卡片库…')
      if (state.status === 'error') {
        return react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' }, '无法读取卡片库。')
      }
      if (missingPrimitives) {
        return react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' },
          '人设卡控件不可用：客户端 UI 原语缺失。')
      }

      if (view.kind === 'editor') {
        return react.createElement(CardEditor, {
          view,
          onChange: (draft) => setView(previous => ({ ...previous, draft })),
          onClose: () => { void reload(); setView({ kind: 'list' }) },
        })
      }

      const chooseDefault = (next) => {
        setState(previous => ({ ...previous, defaultCard: next }))
        void postJson('/default', { cardId: next })
      }

      const showNotice = (tone, text) => setNotice({ tone, text })
      const ids = state.cards.map(entry => entry.id)
      const menuItems = [
        { id: 'export', label: '导出' },
        { id: 'copy', label: '复制' },
        { id: 'delete', label: '删除' },
      ]

      const exportCard = async (cardId) => {
        setMenuFor(null)
        const payload = await getJson(`/cards/${encodeURIComponent(cardId)}`)
        if (payload?.card === undefined) {
          showNotice('error', '导出失败：无法读取卡片。')
          return
        }
        try {
          const blob = new Blob([`${JSON.stringify(payload.card, null, 2)}\n`], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `${cardId}.dshcd`
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          setTimeout(() => URL.revokeObjectURL(url), 60_000)
          showNotice('info', `已开始下载 ${cardId}.dshcd`)
        } catch {
          showNotice('error', '导出失败：浏览器拒绝下载。')
        }
      }

      // Whole-library backup: fetch every card and emit one self-contained
      // JSON collection. The card objects carry image references as local
      // paths, so the backup is portable wherever those paths still resolve.
      const exportAll = async () => {
        if (state.cards.length === 0) {
          showNotice('error', '没有可导出的卡片。')
          return
        }
        const cards = []
        let failed = 0
        for (const entry of state.cards) {
          const payload = await getJson(`/cards/${encodeURIComponent(entry.id)}`)
          if (payload?.card === undefined) { failed += 1; continue }
          cards.push(payload.card)
        }
        if (cards.length === 0) {
          showNotice('error', '导出失败：无法读取任何卡片。')
          return
        }
        const backup = {
          kind: 'dshfc-backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          count: cards.length,
          cards,
        }
        try {
          const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `facet-cards-backup-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.json`
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          setTimeout(() => URL.revokeObjectURL(url), 60_000)
          showNotice(failed > 0 ? 'error' : 'info',
            failed > 0
              ? `已导出 ${cards.length} 张卡；${failed} 张读取失败未包含。`
              : `已导出 ${cards.length} 张卡`)
        } catch {
          showNotice('error', '导出失败：浏览器拒绝下载。')
        }
      }

      const copyCard = async (entry) => {
        setMenuFor(null)
        const payload = await getJson(`/cards/${encodeURIComponent(entry.id)}`)
        if (payload?.card === undefined) {
          showNotice('error', '复制失败：无法读取卡片。')
          return
        }
        const copy = structuredClone(payload.card)
        copy.name = `${payload.card.name ?? entry.name ?? entry.id} 副本`
        copy.id = uniqueCardId(`${entry.id}-copy`, ids)
        let answer = await postJson('/cards', { card: copy })
        if (answer?.code === 'exists') {
          copy.id = uniqueCardId(`${entry.id}-copy`, [...ids, copy.id])
          answer = await postJson('/cards', { card: copy })
        }
        if (answer === undefined || answer.ok !== true) {
          showNotice('error', answer?.error ?? '复制失败')
          return
        }
        void reload()
        showNotice('info', `已复制为 ${copy.id}`)
      }

      // Create one card from parsed JSON, retrying with a fresh id when the
      // server reports a collision. Shared by the single-card and the backup
      // import paths so both get the same rename-on-conflict behaviour.
      const importOne = async (parsed, ids) => {
        let prepared = prepareImport(parsed, ids)
        let answer = await postJson('/cards', { card: prepared.card })
        if (answer?.code === 'exists') {
          prepared = prepareImport(parsed, [...ids, prepared.card.id])
          answer = await postJson('/cards', { card: prepared.card })
        }
        return { prepared, answer }
      }

      const importFile = async (event) => {
        const input = event.target
        const file = input.files?.[0]
        input.value = ''
        if (file === undefined) return
        // Whole-library backups are usually tiny; the 8 MB ceiling only exists
        // so a corrupted choice cannot stall the panel.
        if (file.size > 8_000_000) {
          showNotice('error', '导入失败：文件超过 8 MB。')
          return
        }
        let parsed
        try {
          parsed = JSON.parse(await file.text())
        } catch {
          showNotice('error', '导入失败：不是合法的 JSON。')
          return
        }
        // A backup from 导出全部: { kind: 'dshfc-backup', cards: [...] }.
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
          && parsed.kind === 'dshfc-backup' && Array.isArray(parsed.cards)) {
          if (parsed.cards.length === 0) {
            showNotice('error', '导入失败：备份里没有卡片。')
            return
          }
          const knownIds = [...ids]
          let imported = 0
          let renamed = 0
          const failures = []
          for (const raw of parsed.cards) {
            if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
              failures.push('(格式错误)')
              continue
            }
            const originalId = typeof raw.id === 'string' ? raw.id : ''
            const { prepared, answer } = await importOne(raw, knownIds)
            if (answer === undefined || answer.ok !== true) {
              failures.push(originalId !== '' ? originalId : '(未知卡)')
              continue
            }
            if (originalId !== '' && prepared.card.id !== originalId) renamed += 1
            knownIds.push(prepared.card.id)
            imported += 1
          }
          void reload()
          showNotice(failures.length > 0 ? 'error' : 'info',
            failures.length > 0
              ? `已导入 ${imported} 张，重命名 ${renamed} 张，失败 ${failures.length} 张（${failures.slice(0, 3).join('、')}${failures.length > 3 ? ' 等' : ''}）。`
              : `已导入 ${imported} 张${renamed > 0 ? `，重命名 ${renamed} 张` : ''}`)
          return
        }
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          showNotice('error', '导入失败：卡片必须是 JSON 对象。')
          return
        }
        if (file.size > 1_000_000) {
          showNotice('error', '导入失败：文件超过 1 MB。')
          return
        }
        const { prepared, answer } = await importOne(parsed, ids)
        if (answer === undefined || answer.ok !== true) {
          showNotice('error', answer?.error ?? '导入失败')
          return
        }
        void reload()
        showNotice('info', prepared.versionWarning
          ? `已导入为 ${prepared.card.id}；版本未验证，已按当前格式读取。`
          : `已导入为 ${prepared.card.id}`)
      }

      const removeCard = async (entry) => {
        setConfirmDelete(null)
        const answer = await deleteJson(`/cards/${encodeURIComponent(entry.id)}`)
        if (answer === undefined) {
          showNotice('error', '删除失败：无法连接宿主。')
          return
        }
        if (answer.ok !== true) {
          showNotice('error', answer.error ?? '删除失败')
          return
        }
        void reload()
        const warnings = answer.warnings ?? []
        showNotice(warnings.length > 0 ? 'error' : 'info', warnings.length > 0
          ? `已删除 ${entry.id}，但引用清理未完全成功。`
          : `已删除 ${entry.id}；清除 ${answer.detached ?? 0} 个会话的固定设置，刷新 ${answer.rebound ?? 0} 个运行中的会话。`)
      }

      const defaultName = state.cards.find(entry => entry.id === state.defaultCard)?.name
        ?? state.defaultCard
        ?? '未设置'

      // Sorting and filtering are pure view state: the host always returns the
      // whole library, and reordering client-side keeps the toolbar instant.
      const categories = [...new Set(state.cards
        .map(entry => (typeof entry.category === 'string' && entry.category.trim() ? entry.category.trim() : null))
        .filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh'))
      const visibleCards = state.cards
        .filter(entry => catFilter === 'all'
          || (typeof entry.category === 'string' && entry.category.trim() === catFilter))
        .slice()
        .sort((a, b) => {
          if (sortBy === 'name') return (a.name ?? a.id).localeCompare(b.name ?? b.id, 'zh')
          const diff = (b.usage ?? 0) - (a.usage ?? 0)
          return sortBy === 'usage-asc' ? -diff : diff
        })
      const sortOptions = [
        ['usage-desc', '调用最多'],
        ['usage-asc', '调用最少'],
        ['name', '按名称'],
      ]

      /** One list row's thumbnail: the linked image over a letter glyph. */
      function rowThumb(entry) {
        const glyph = react.createElement('span', { className: 'dshfc-glyph' },
          (entry.name ?? entry.id).slice(0, 1))
        if (typeof entry.image !== 'string' || entry.image.trim() === '') return glyph
        return react.createElement(
          'span',
          { style: { position: 'relative', width: '34px', height: '34px', flex: 'none' } },
          glyph,
          react.createElement('img', {
            className: 'dshfc-thumb',
            style: { position: 'absolute', left: 0, top: 0 },
            src: `${ROUTE}/images/${encodeURIComponent(entry.id)}`,
            alt: '',
            onError: (event) => { event.target.style.display = 'none' },
          }),
        )
      }

      const rows = visibleCards.map(entry => react.createElement(
        'li',
        { key: entry.id, className: 'dshfc-row' },
        rowThumb(entry),
        react.createElement('button', {
          type: 'button',
          className: 'dshfc-name',
          onClick: () => { void openEditor(entry.id) },
        }, entry.name ?? entry.id),
        typeof entry.category === 'string' && entry.category.trim()
          ? react.createElement('span', { className: 'dshfc-chip' }, entry.category.trim())
          : null,
        react.createElement('span', { className: 'dshfc-meta' }, `${entry.tokens} token`),
        react.createElement('span', {
          className: 'dshfc-chip',
          title: entry.lastUsed ? `最近调用 ${entry.lastUsed}` : '还没有被调用过',
        }, `调用 ${entry.usage ?? 0} 次`),
        entry.sessionsUsing > 0
          ? react.createElement('span', { className: 'dshfc-chip' }, `${entry.sessionsUsing} 个会话`)
          : null,
        react.createElement(
          'span',
          { className: 'dshfc-actions' },
          confirmDelete === entry.id
            ? [
                react.createElement('span', { key: 'ask', className: 'dshfc-meta' }, '确认删除？'),
                react.createElement(Button, {
                  key: 'yes',
                  size: 'sm',
                  variant: 'outline',
                  onClick: () => { void removeCard(entry) },
                }, '确认'),
                react.createElement(Button, {
                  key: 'no',
                  size: 'sm',
                  variant: 'ghost',
                  onClick: () => setConfirmDelete(null),
                }, '取消'),
              ]
            : [
                entry.sessionsUsing > 0
                  // Re-applying is opt-in and separate from saving: a live session
                  // keeps the card version it started with, so a saved edit reaches
                  // it only when someone presses this. The list is reloaded after,
                  // because the session count it reports can change.
                  ? react.createElement(Button, {
                      key: 'apply',
                      size: 'sm',
                      variant: 'outline',
                      onClick: async () => {
                        const answer = await postJson(`/cards/${encodeURIComponent(entry.id)}/apply`, {})
                        // The count on success is not shown; only a failure needs a
                        // voice here, and a success clears whatever the last one said.
                        setApplyError(answer === undefined || answer.ok !== true
                          ? (answer?.error ?? '重新应用失败')
                          : null)
                        void reload()
                      },
                    }, '重新应用')
                  : null,
                react.createElement(Menu, {
                  key: 'menu',
                  open: menuFor === entry.id,
                  items: menuItems,
                  onSelect: (action) => {
                    setMenuFor(null)
                    if (action === 'export') void exportCard(entry.id)
                    else if (action === 'copy') void copyCard(entry)
                    else if (action === 'delete') setConfirmDelete(entry.id)
                  },
                  onClose: () => setMenuFor(null),
                  side: 'bottom',
                  anchor: react.createElement(Pill, {
                    active: menuFor === entry.id,
                    onClick: () => setMenuFor(menuFor === entry.id ? null : entry.id),
                  }, '更多'),
                }),
                react.createElement(Button, {
                  key: 'edit',
                  size: 'sm',
                  variant: 'ghost',
                  onClick: () => { void openEditor(entry.id) },
                }, '编辑'),
              ],
        ),
      ))

      return react.createElement(
        'div',
        { className: 'dshfc-root' },
        notice === null
          ? null
          : react.createElement('p', {
              className: 'dshfc-callout',
              'data-tone': notice.tone === 'error' ? 'error' : undefined,
            }, notice.text),
        openError === null
          ? null
          : react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' }, openError),
        applyError === null
          ? null
          : react.createElement('p', { className: 'dshfc-callout', 'data-tone': 'error' }, applyError),
        react.createElement(
          'div',
          { className: 'dshfc-card' },
          react.createElement(
            'div',
            { className: 'dshfc-rowline' },
            react.createElement('span', { className: 'dshfc-label' }, '默认人设卡'),
            react.createElement(Menu, {
              open: defaultOpen,
              items: state.cards.map(entry => ({ id: entry.id, label: entry.name ?? entry.id })),
              selectedId: state.defaultCard,
              onSelect: (id) => { setDefaultOpen(false); chooseDefault(id) },
              onClose: () => setDefaultOpen(false),
              side: 'bottom',
              anchor: react.createElement(Pill, {
                active: defaultOpen,
                onClick: () => setDefaultOpen(!defaultOpen),
              }, defaultName),
            }),
            react.createElement('span', { className: 'dshfc-spacer' }),
            react.createElement(Button, {
              variant: 'outline',
              onClick: () => { void exportAll() },
            }, '导出全部'),
            react.createElement(Button, {
              variant: 'outline',
              onClick: () => fileInput.current?.click(),
            }, '导入'),
            react.createElement(Button, {
              variant: 'primary',
              onClick: () => { void openEditor(undefined) },
            }, '新建卡片'),
          ),
          react.createElement('input', {
            ref: fileInput,
            type: 'file',
            accept: '.dshcd,application/json',
            style: { display: 'none' },
            onChange: importFile,
          }),
          react.createElement('p', { className: 'dshfc-muted' },
            '新会话默认使用这张卡；单个会话可在输入框左侧切换。'),
        ),
        state.cards.length === 0
          ? react.createElement('div', { className: 'dshfc-empty' }, '卡片库为空。点「新建卡片」开始。')
          : react.createElement(
              'div',
              { className: 'dshfc-chiprow', key: 'filters' },
              categories.length > 0
                ? [
                    react.createElement('span', { key: 'cl', className: 'dshfc-label' }, '分类'),
                    react.createElement('button', {
                      key: 'cat-all',
                      type: 'button',
                      className: 'dshfc-chipbtn',
                      'data-on': catFilter === 'all' ? '' : undefined,
                      onClick: () => setCatFilter('all'),
                    }, `全部 (${state.cards.length})`),
                  ].concat(categories.map(cat => react.createElement('button', {
                    key: `cat-${cat}`,
                    type: 'button',
                    className: 'dshfc-chipbtn',
                    'data-on': catFilter === cat ? '' : undefined,
                    onClick: () => setCatFilter(catFilter === cat ? 'all' : cat),
                  }, `${cat} (${state.cards.filter(entry => (entry.category ?? '').trim() === cat).length})`)))
                : null,
              react.createElement('span', { key: 'gap', style: { width: '10px' } }),
              react.createElement('span', { key: 'sl', className: 'dshfc-label' }, '排序'),
              sortOptions.map(([key, label]) => react.createElement('button', {
                key: `sort-${key}`,
                type: 'button',
                className: 'dshfc-chipbtn',
                'data-on': sortBy === key ? '' : undefined,
                onClick: () => setSortBy(key),
              }, label)),
            ),
        state.cards.length === 0
          ? null
          : visibleCards.length === 0
            ? react.createElement('div', { className: 'dshfc-empty' }, '这个分类下没有卡片。')
            : react.createElement('ul', { className: 'dshfc-list' }, rows),
      )
    }

    /**
     * The options a switcher offers, in menu order.
     *
     * One source, two presentations: the popover menu and the fallback select
     * both render this list, so they cannot disagree about what is on offer.
     * `id` is the option value, namespaced as `card:<id>` / `none` / `default`
     * so a card whose id literally reads "none" keeps its own row.
     * @param mode - `'session'` or `'global'`.
     * @param cards - the `/cards` payload.
     * @returns the entries, in the order a menu should show them.
     */
    function switcherEntries(mode, cards) {
      const entries = []
      if (mode === 'session') {
        entries.push({ id: 'none', label: '不使用人设卡' })
        entries.push({ id: 'default', label: '跟随默认' })
      }
      for (const card of cards?.cards ?? []) {
        entries.push({
          id: `card:${card.id}`,
          label: card.name ?? card.id,
          // Picker-side extras: the dock tiles show usage and thumbnails, and
          // the fallback select just ignores unknown fields.
          usage: card.usage ?? 0,
          image: card.image ?? null,
          category: card.category ?? null,
        })
      }
      return entries
    }

    /**
     * Styling for the fallback select only; the primary control is a Pill.
     *
     * A native select is chunky by default, which reads as a form control
     * dropped into a row of small icon buttons. Stripping its chrome at least
     * lets it blend instead of announcing itself.
     */
    const CHIP_STYLE = {
      appearance: 'none',
      border: 0,
      borderRadius: '6px',
      background: 'transparent',
      color: 'inherit',
      font: 'inherit',
      padding: '2px 0',
      cursor: 'pointer',
      maxWidth: '150px',
    }

    /**
     * Dock 式选择面板：portal 到 body 的横向浮层。
     *
     * 宿主 Menu 是竖长列表，卡片一多就顶出屏幕；Dock 把所有卡片按调用次数
     * 从高到低铺成一排排磁贴，一眼扫完。定位用 bottom（贴在锚点胶囊上方），
     * 不用 transform——transform 会把 fixed 子孙的包含块变成面板自己。
     * @param props.anchor - 触发胶囊的包裹元素（测量用）。
     * @param props.entries - 展示条目（已排好序）。
     * @param props.value - 当前选中值。
     * @param props.onChoose - 选中回调。
     * @param props.onClose - 关闭回调。
     */
    function CardDock({ anchor, entries, value, onChoose, onClose }) {
      const panelRef = react.useRef(null)
      const [style, setStyle] = react.useState(null)

      // 锚点上方摆位：宽度对齐输入区一列，四边收回视口，高度不超过锚点上方的空间。
      const place = react.useCallback(() => {
        const el = panelRef.current
        if (!anchor || !el) return
        const r = anchor.getBoundingClientRect()
        const vw = window.innerWidth
        const w = Math.min(680, vw - 16)
        const hgt = el.offsetHeight
        const maxH = Math.max(140, r.top - 16)
        let left = r.left + r.width / 2 - w / 2
        left = Math.max(8, Math.min(left, vw - 8 - w))
        const top = Math.max(8, r.top - 8 - Math.min(hgt, maxH))
        setStyle((previous) => {
          const next = { left, top, width: w, maxHeight: maxH }
          return previous !== null && previous.left === next.left && previous.top === next.top
            && previous.width === next.width && previous.maxHeight === next.maxHeight
            ? previous
            : next
        })
      }, [anchor])

      react.useLayoutEffect(() => { place() }, [place])

      // 面板内容异步撑高 / 图片加载后尺寸会变：一变就重新收位。
      react.useEffect(() => {
        const el = panelRef.current
        if (!el || typeof ResizeObserver === 'undefined') return undefined
        const ro = new ResizeObserver(() => place())
        ro.observe(el)
        return () => ro.disconnect()
      }, [place])

      // 点外面 / Esc / 窗口缩放都收起；点面板或胶囊自身不算外面。
      react.useEffect(() => {
        const onDoc = (event) => {
          if (event.target instanceof Element
            && (panelRef.current?.contains(event.target) || anchor?.contains(event.target))) return
          onClose()
        }
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        const onResize = () => onClose()
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        window.addEventListener('resize', onResize)
        return () => {
          document.removeEventListener('mousedown', onDoc)
          document.removeEventListener('keydown', onKey)
          window.removeEventListener('resize', onResize)
        }
      }, [onClose, anchor])

      if (!ReactDOM || typeof ReactDOM.createPortal !== 'function') return null

      return ReactDOM.createPortal(
        react.createElement(
          'div',
          { ref: panelRef, className: 'dshfc-dock', style: style ?? undefined },
          react.createElement(
            'div',
            { className: 'dshfc-dockhead' },
            react.createElement('span', { className: 'dshfc-docktitle' },
              `人设卡 · ${entries.length} 张 · 按调用次数排前`),
            react.createElement('span', { className: 'dshfc-meta' }, 'Esc 关闭'),
          ),
          react.createElement(
            'div',
            { className: 'dshfc-dockgrid' },
            entries.map(entry => react.createElement(
              'button',
              {
                key: entry.id,
                type: 'button',
                className: 'dshfc-tile',
                'data-on': value === entry.id ? '' : undefined,
                title: [
                  entry.category ? `分类：${entry.category}` : null,
                  `调用 ${entry.usage ?? 0} 次`,
                ].filter(Boolean).join(' · '),
                onClick: () => onChoose(entry.id),
              },
              typeof entry.image === 'string' && entry.image.trim()
                ? react.createElement('img', {
                    className: 'dshfc-tileimg',
                    src: `${ROUTE}/images/${encodeURIComponent(entry.id.slice('card:'.length))}`,
                    alt: '',
                    onError: (event) => {
                      // 图挂了就退回首字磁贴，保持格子不塌。
                      const glyph = document.createElement('span')
                      glyph.className = 'dshfc-tileglyph'
                      glyph.textContent = entry.label.slice(0, 1)
                      event.target.replaceWith(glyph)
                    },
                  })
                : react.createElement('span', { className: 'dshfc-tileglyph' }, entry.label.slice(0, 1)),
              react.createElement('span', { className: 'dshfc-tilelabel' }, entry.label),
              react.createElement('span', { className: 'dshfc-tilemeta' },
                (entry.usage ?? 0) > 0 ? `${entry.usage} 次` : '—'),
            )),
          ),
        ),
        document.body,
      )
    }

    /**
     * Card picker for a cell beside the composer.
     *
     * The trigger is a Pill and the popup is the shipped Menu, so the control
     * wears the same clothes as the ones beside it and dsh keeps ownership of
     * anchoring and outside-click dismissal. When those primitives are missing,
     * the same entries render as a plain select - plainer, but still working.
     * @param props - slot props; `sessionId` selects the mode.
     */
    function CardSwitcher(props) {
      const mode = switcherMode(props)
      const sessionId = mode === 'session' ? props.sessionId : undefined
      const [state, setState] = react.useState({ status: 'loading', entries: [], value: '' })
      const [open, setOpen] = react.useState(false)
      const [reloadKey, setReloadKey] = react.useState(0)
      // The dock panel measures this span wrapping the pill; declared with the
      // other hooks so the hook order is identical in every render.
      const anchorRef = react.useRef(null)
      // A manual refresh (menu open) must not overwrite the selection the user
      // just made with a list that is only stale, not authoritative.
      const keepValue = react.useRef(false)

      react.useEffect(() => {
        let cancelled = false
        const load = async () => {
          const cards = await getJson('/cards')
          if (cancelled) return
          if (cards === undefined) {
            setState({ status: 'error', entries: [], value: '' })
            return
          }
          const session = sessionId === undefined
            ? undefined
            : await getJson(`/session/${encodeURIComponent(sessionId)}`)
          if (cancelled) return
          const preserve = keepValue.current
          keepValue.current = false
          setState(previous => {
            const entries = switcherEntries(mode, cards)
            const computed = initialSelection(mode, cards, session)
            return {
              status: 'ready',
              entries,
              value: preserve ? nextSelection(entries, previous.value, computed) : computed,
            }
          })
        }
        void load()
        return () => { cancelled = true }
      }, [mode, sessionId, reloadKey])

      // The list is cached for the life of the composer. A card created in
      // settings after that first read would otherwise stay invisible until
      // a page reload, so every open asks the host again.
      const reload = () => {
        keepValue.current = true
        setReloadKey(key => key + 1)
      }

      // Nothing at all until the host answers: a control that appears and then
      // changes its mind is worse than one that appears settled.
      if (state.status === 'loading') return null
      if (state.status === 'error') {
        return react.createElement('span', { style: { opacity: 0.5, fontSize: '12px' } }, '人设卡')
      }

      const choose = (option) => {
        setOpen(false)
        setState(previous => ({ ...previous, value: option }))
        if (sessionId === undefined) {
          if (option.startsWith('card:')) {
            void postJson('/default', { cardId: option.slice('card:'.length) })
          }
          return
        }
        const sessionPath = `/session/${encodeURIComponent(sessionId)}/card`
        // The body's shape carries the answer: a card id pins, null takes no
        // card at all, and an empty body drops the entry.
        if (option === 'none') void postJson(sessionPath, { cardId: null })
        else if (option === 'default') void postJson(sessionPath, {})
        else void postJson(sessionPath, { cardId: option.slice('card:'.length) })
      }

      const togglePicker = () => {
        if (!open) reload()
        setOpen(!open)
      }

      // Dock 面板的条目顺序：会话模式里两个状态项固定在最前，其余卡片按
      // 调用次数从高到低、再按名称排——最常用的永远在最顺手的第一个格。
      const current = state.entries.find(entry => entry.id === state.value)
      const cardEntries = state.entries
        .filter(entry => entry.id.startsWith('card:'))
        .slice()
        .sort((a, b) => ((b.usage ?? 0) - (a.usage ?? 0))
          || String(a.label).localeCompare(String(b.label), 'zh'))
      const dockEntries = mode === 'session'
        ? [
            { id: 'none', label: '不使用人设卡', usage: 0 },
            { id: 'default', label: '跟随默认', usage: 0 },
          ].concat(cardEntries)
        : cardEntries

      // The pill is wrapped in a measured span because the shipped primitives
      // are not guaranteed to forward refs.
      if (canUseMenu && ReactDOM && typeof ReactDOM.createPortal === 'function') {
        return react.createElement(
          react.Fragment,
          null,
          react.createElement(
            'span',
            { ref: anchorRef, style: { display: 'inline-flex' } },
            react.createElement(
              Pill,
              { onClick: togglePicker, active: open, title: '人设卡' },
              react.createElement('span', null, current?.label ?? '人设卡'),
              ChevronIcon === undefined ? null : react.createElement(
                'span',
                { style: { marginLeft: '4px', display: 'inline-flex', verticalAlign: 'middle' }, 'aria-hidden': true },
                react.createElement(ChevronIcon),
              ),
            ),
          ),
          open
            ? react.createElement(CardDock, {
                anchor: anchorRef.current,
                entries: dockEntries,
                value: state.value,
                onChoose: choose,
                onClose: () => setOpen(false),
              })
            : null,
        )
      }

      // 无 react-dom 时的兜底：宿主 Menu（竖列），再不行才是原生 select。
      if (canUseMenu) {
        return react.createElement(Menu, {
          open,
          items: state.entries,
          selectedId: state.value,
          onSelect: choose,
          onClose: () => setOpen(false),
          // Opening upward is what a control at the bottom of the composer
          // needs, and it is what the shipped permission selector does.
          side: 'top',
          anchor: react.createElement(
            Pill,
            { onClick: togglePicker, active: open, title: '人设卡' },
            react.createElement('span', null, current?.label ?? '人设卡'),
            ChevronIcon === undefined ? null : react.createElement(
              'span',
              { style: { marginLeft: '4px', display: 'inline-flex', verticalAlign: 'middle' }, 'aria-hidden': true },
              react.createElement(ChevronIcon),
            ),
          ),
        })
      }

      return react.createElement(
        'select',
        {
          style: CHIP_STYLE,
          value: state.value,
          title: '人设卡',
          onFocus: reload,
          onChange: (event) => choose(event.target.value),
        },
        state.entries.map(entry =>
          react.createElement('option', { key: entry.id, value: entry.id }, entry.label)),
      )
    }

    /**
     * Activate the browser half.
     * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
     */
    function apply(ctx) {
      /**
       * Contribute one cell to a slot, tolerating its absence.
       *
       * `slots.inject` fires only once something declares the key, so a key the
       * running build does not have is silent rather than fatal - a direct
       * `slots.register` against an undeclared slot fails plugin activation
       * instead. Each mount is isolated because a client plugin that throws out
       * of apply() can take the whole client composition with it, which is how
       * plugin entries disappear from the UI entirely.
       * @param key - the slot to contribute to.
       * @param options - registration options; the protocol is id / order / label.
       * @param component - the component to render in that cell.
       */
      const mount = (key, options, component) => {
        try {
          const slots = ctx.get('slots')
          if (slots === undefined || typeof slots.inject !== 'function') return
          slots.inject(key, () => slots.register(options, component))
        } catch {
          // An absent or reshaped slot must degrade to "this surface is
          // missing", never to a broken client.
        }
      }

      // A settings page is the documented way to obtain a whole content area.
      // `id` has to be unique among sections - 'plugins' and 'agent-presets'
      // are shipped ones - and `order` places this entry in the navigation.
      mount('settings.section', {
        name: 'settings.section',
        id: 'facet-cards',
        order: 20,
        label: () => '人设卡',
      }, CardSettingsSection)

      // The composer tool row. Confirmed against the live client tree rather
      // than guessed: list cardinality, session scope, replaceRisk none, and an
      // empty occupant list. A list slot under a fresh id is purely additive,
      // so this cannot displace the tools already sitting in that row.
      //
      // Not conversation.input.dock, where the git-graph branch chip lives: that
      // chip renders only for a blank session, and a card switcher that appears
      // only before a session starts cannot do the one thing it is for.
      mount('conversation.input.left', {
        name: 'conversation.input.left',
        id: 'facet-cards',
        order: 0,
      }, CardSwitcher)
    }

    // Cordis runs apply() only once the named services exist. Without this,
    // apply() can run before `slots` is provided, ctx.get('slots') is
    // undefined, and both mounts silently do nothing.
    const inject = ['slots']

    return { apply, inject, editorGroups, fieldOf, initialSelection, isDirty, nextSelection, prepareImport, sanitizeCardId, switcherEntries, switcherMode, uniqueCardId, withField }
  },
})
