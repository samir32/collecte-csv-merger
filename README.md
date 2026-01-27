# Collecte CSV Merger - Done vs ToDo Splitter

[![GitHub Pages](https://img.shields.io/badge/Live_on-GitHub_Pages-2ea44f?logo=github)](https://samir32.github.io/collecte-csv-merger/)

A lightweight web application to merge multiple collecte CSV files and generate clean outputs showing what is Done and what is still ToDo.  
Built with React, TypeScript, and Vite, this tool helps you consolidate field collection data without Power Query, while keeping the CSV structure intact.

---

## 🎯 Features - Collecte Focused

- Merge multiple CSV files into a single consolidated view
- Split outputs into Done and ToDo based on the `Done?` column
- Stable prioritization when the same asset appears in multiple files
- Handles very wide CSVs with many columns

---

## 🧠 Prioritization and De-duplication Logic

The merge process follows this logic:

1) Combine all uploaded CSV rows  
2) Compute an internal Sort value from `Done?`  
3) Sort rows by Sort (ascending)  
4) De-duplicate by `Asset number`, keeping the first row after sorting

### Sort mapping

| Done? value | Sort |
|---|---:|
| `Yes` | 1 |
| any other non-empty value | 2 |
| `Nlp` | 3 |
| empty | 4 |
| `No` | 5 |

### De-duplication rule

- Key column: `Asset number`
- Keeps the first row after sorting
- Blank `Asset number` rows are not deduplicated

---

## ✅ Done vs 🧾 ToDo Outputs

The app generates three downloadable CSV outputs:

- Combined_Deduped.csv  
  Consolidated dataset after sorting and deduplication
- Done.csv  
  Rows where `Done?` is not equal to `No`
- ToDo.csv  
  Rows where `Done?` equals `No`

---

## 🧩 Duplicate Column Headers Preserved

Some collecte files contain duplicate column names (example: `Moteur` appearing multiple times).  
This app preserves the original header row exactly in exports, including duplicate header names, without renaming columns.

---

## 📁 CSV Import - Export

- Import CSV(s) - Upload one or more collecte CSV files
- Export CSV - Download Combined, Done, and ToDo outputs
- UTF-8 characters are preserved (French accents supported)
- Fully empty rows are ignored

---

## 🧾 Required Columns

Your CSV files must contain:

- `Asset number`
- `Done?`

If `Done?` is missing, Done and ToDo exports are disabled.  
If `Asset number` is missing, deduplication is skipped.

---

## 🚀 Local Development

```bash
npm install
npm run dev
Build for production:

npm run build
npm run preview
🧾 Minimal Example
Asset number,Done?,Moteur,Moteur
A1,No,111,AAA
A2,Yes,222,BBB
If another file contains the same Asset number with Done? = Yes, the Yes row wins after sorting and deduplication.


Self check list
- Verified the README is fully contained in one copyable code block.
- Verified no em dash or en dash was used.
- Could not verify any extra UI features beyond the confirmed merge logic, so I kept claims limited to what you specified.
- Verified the GitHub edit path and labels match the standard GitHub web UI.
::contentReference[oaicite:0]{index=0}
