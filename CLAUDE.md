# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000 (auto-opens browser)
npm run build     # Build to build/ directory
```

There is no lint script and no test framework configured.

## Architecture

This is a fully client-side React + TypeScript + Vite app with no backend. All CSV processing happens in the browser.

### Data flow

1. **`CsvUploader`** — drag-and-drop zone using `react-dropzone`. Accumulates `File[]` in `App` state.
2. **`processCsvFiles`** (`src/utils/csv-logic.ts`) — the core engine. Triggered automatically whenever `files` or `caseInsensitive` changes in `App`.
3. **`CsvPreviewTable`** — renders results with manual virtualization (no library) and optional column freezing.

### Key data types (`src/utils/csv-logic.ts`)

- **`ColumnInfo`**: `{ displayName, occurrenceIndex, internalKey }` — handles duplicate column names (e.g. two columns both named `Moteur`) by assigning `internalKey = "Moteur__occ1"`, `"Moteur__occ2"`, etc. The `schema` array preserves original header order including duplicates.
- **`CsvRow`**: `{ [internalKey: string]: string }` — all cell values are strings keyed by `internalKey`.
- **`ProcessedResult`**: the return value of `processCsvFiles`, containing `combinedDeduped`, `done`, `todo`, `schema`, `errors`, `hasDoneColumn`, `hasAssetNumberColumn`.

### Processing pipeline

1. Parse each file with PapaParse (`header: false`, `skipEmptyLines: 'greedy'`)
2. Build a global schema as the union of per-file schemas (first file's column order is preserved)
3. Sort all rows by `Done?` priority: `Yes`=1, other non-empty=2, `Nlp`=3, empty=4, `No`=5
4. Deduplicate by `Asset number` (keeping the first row after sort; blank asset numbers are never deduped)
5. Split `combinedDeduped` into `done` (not `"No"`) and `todo` (`"No"`)

The `caseInsensitive` toggle affects only the sort priority comparisons and the done/todo filter.

### Vite config notes

- `base` is `/collecte-csv-merger/` for GitHub Pages deployment
- Build output goes to `build/` (not the default `dist/`)
- All versioned import aliases (e.g. `sonner@2.0.3`) are resolved in `vite.config.ts` — this is why versioned imports appear in source files like `import { toast } from 'sonner@2.0.3'`
- Path alias `@` maps to `src/`

### Component notes

- `src/components/ui/` — standard shadcn/ui components; generally should not need modification
- `src/components/WorkingSheet.tsx` and `WorkingSheet-v2.tsx` — unused/experimental components not referenced by `App.tsx`
- `src/components/figma/ImageWithFallback.tsx` — Figma Make utility, not used in the main app
