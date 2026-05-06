# Visual Editor — manual E2E checklist

The editor runs against a live page render, so end-to-end verification
needs a running stack (`make deploy-local` or `docker compose up`)
plus an admin account. The scenarios below mirror the test plan from
the design document and use `playwright-cli` (see
`~/.claude/rules/playwright-cli.md`).

## Smoke test

Start the stack and grab an admin session:

```bash
playwright-cli open http://localhost:8099/login
playwright-cli snapshot           # find the email/password fields
playwright-cli fill <e1> "admin@example.com"
playwright-cli fill <e2> "<your-admin-password>"
playwright-cli click <submit-ref>
```

Then visit any public page that has at least one block:

```bash
playwright-cli goto http://localhost:8099/about
playwright-cli snapshot           # confirm "Edit page" toggle is present
playwright-cli eval "document.documentElement.outerHTML.includes('squilla:block:start:0:')"
# → must be true. If false, the marker pipeline is broken.
```

## Edit-and-Save

```bash
playwright-cli click <edit-toggle>
playwright-cli click <hero-block>      # click anywhere on the rendered hero
playwright-cli fill <heading-input> "New heading"
playwright-cli click <save-button>
playwright-cli reload
playwright-cli eval "document.body.innerText.includes('New heading')"
# → must be true.
```

## Add / Delete / Duplicate / Reorder

- Add: click any in-page `+` button → pick a block from the modal
  → confirm it appears in the side-panel block list with an
  "unsaved" badge → Save → reload → confirm new block renders.
- Duplicate: select a block → click Duplicate in the actions row
  → Save → reload → confirm two blocks of the same type.
- Delete: select a block → click Delete → confirm prompt → Save
  → reload → confirm block is gone.
- Reorder: drag a block in the side-panel list (use the `⋮⋮`
  handle) → Save → reload → confirm new order.

## Privacy / payload guard

Log out, then re-fetch the same page:

```bash
playwright-cli click <logout>
playwright-cli reload
playwright-cli eval "document.documentElement.outerHTML.includes('squilla:block:start')"
# → must be false. Anonymous visitors must not see editor markers.
playwright-cli eval "document.documentElement.outerHTML.includes('visual-editor/static/editor.js')"
# → must be false. The bootstrap script must not be emitted.
```

## Known v1 limitations

- Only admin users see the editor. Custom roles with write access
  for a node type but no `admin` slug get markers (Step 2) but no
  bootstrap (Step 4). Loosen this in a future iteration.
- Inline preview is reload-on-Save; no per-keystroke re-render.
- Field types beyond text/number/boolean/url/select/textarea show
  a one-line summary plus an "Edit in admin" deep link.
- No drafts / revisions; Save publishes immediately.
- Single-admin assumption — last write wins on concurrent edits.
