import Papa from 'papaparse';

export interface ColumnInfo {
  displayName: string;
  occurrenceIndex: number;
  internalKey: string;
}

export interface CsvRow {
  [internalKey: string]: string;
}

export interface ProcessedResult {
  combinedDeduped: CsvRow[];
  done: CsvRow[];
  todo: CsvRow[];
  allRowsCount: number;
  schema: ColumnInfo[];
  errors: string[];
  hasDoneColumn: boolean;
  hasAssetNumberColumn: boolean;
}

export async function processCsvFiles(
  files: File[],
  caseInsensitive: boolean,
  preserveOrder: boolean = true  // NEW: Don't sort by default (matches VBA behavior)
): Promise<ProcessedResult> {
  let allRows: CsvRow[] = [];
  let globalSchema: ColumnInfo[] = [];
  const errors: string[] = [];
  let allRowsCount = 0;

  // 1. Parse all files and align schema
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();
    
    // PapaParse handles UTF-8 by default if the input is a string
    const parseResult = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: 'greedy', // This handles "fully empty" rows
    });

    const rows = parseResult.data;
    if (rows.length === 0) continue;

    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    // Build local schema with occurrence indices
    const localSchema: ColumnInfo[] = [];
    const counts: Record<string, number> = {};

    headerRow.forEach((colName) => {
      const displayName = colName || ""; // Handle empty headers
      counts[displayName] = (counts[displayName] || 0) + 1;
      const occurrenceIndex = counts[displayName];
      localSchema.push({
        displayName,
        occurrenceIndex,
        internalKey: `${displayName}__occ${occurrenceIndex}`,
      });
    });

    // Merge into global schema
    if (i === 0) {
      globalSchema = [...localSchema];
    } else {
      localSchema.forEach((localCol) => {
        if (!globalSchema.find(g => g.internalKey === localCol.internalKey)) {
          globalSchema.push(localCol);
        }
      });
    }

    // Process data rows
    dataRows.forEach((row) => {
      // Ignore fully empty rows (every cell is empty or whitespace)
      const isFullyEmpty = row.every(cell => !cell || cell.trim().length === 0);
      if (isFullyEmpty || row.length === 0) return;

      allRowsCount++;
      const rowObj: CsvRow = {};
      
      // Pad or truncate
      const cellCount = headerRow.length;
      globalSchema.forEach(globalCol => {
        // Find if this column exists in the current file's local schema
        const localIndex = localSchema.findIndex(l => l.internalKey === globalCol.internalKey);
        if (localIndex !== -1 && localIndex < row.length) {
          rowObj[globalCol.internalKey] = row[localIndex];
        } else {
          rowObj[globalCol.internalKey] = ""; // Pad missing
        }
      });

      allRows.push(rowObj);
    });
  }

  // 2. Check for required columns
  // Note: We search for the first occurrence of these column names
  const doneCol = globalSchema.find(c => c.displayName.trim() === "Done?");
  const assetNumberCol = globalSchema.find(c => c.displayName.trim() === "Asset number");

  const hasDoneColumn = !!doneCol;
  const hasAssetNumberColumn = !!assetNumberCol;

  if (!hasDoneColumn) errors.push("Missing column: Done?");
  if (!hasAssetNumberColumn) errors.push("Missing column: Asset number (dedupe skipped)");

  // 3. Combine Logic: Sort (only if preserveOrder is false)
  let processedData = [...allRows];
  
  if (hasDoneColumn && !preserveOrder) {
    const getSortPriority = (val: string): number => {
      const trimmed = val.trim();
      const compare = caseInsensitive ? trimmed.toLowerCase() : trimmed;
      const yes = caseInsensitive ? "yes" : "Yes";
      const nlp = caseInsensitive ? "nlp" : "Nlp";
      const no = caseInsensitive ? "no" : "No";

      if (compare === yes) return 1;
      if (compare === nlp) return 3;
      if (compare === "") return 4;
      if (compare === no) return 5;
      return 2;
    };

    processedData.sort((a, b) => {
      const valA = a[doneCol.internalKey] || "";
      const valB = b[doneCol.internalKey] || "";
      return getSortPriority(valA) - getSortPriority(valB);
    });
  }

  // 4. Combine Logic: Deduplicate
  if (hasAssetNumberColumn) {
    const seen = new Set<string>();
    const deduped: CsvRow[] = [];

    processedData.forEach((row) => {
      const val = row[assetNumberCol.internalKey] || "";
      const trimmedVal = val.trim();

      if (trimmedVal === "") {
        // If Asset number is blank, do not deduplicate those rows (keep all)
        deduped.push(row);
      } else if (!seen.has(trimmedVal)) {
        seen.add(trimmedVal);
        deduped.push(row);
      }
    });
    processedData = deduped;
  }

  // 5. Create Outputs
  const combinedDeduped = processedData;
  let done: CsvRow[] = [];
  let todo: CsvRow[] = [];

  if (hasDoneColumn) {
    done = combinedDeduped.filter(row => {
      const val = (row[doneCol.internalKey] || "").trim();
      const no = caseInsensitive ? "no" : "No";
      const compare = caseInsensitive ? val.toLowerCase() : val;
      return compare !== no;
    });

    todo = combinedDeduped.filter(row => {
      const val = (row[doneCol.internalKey] || "").trim();
      const no = caseInsensitive ? "no" : "No";
      const compare = caseInsensitive ? val.toLowerCase() : val;
      return compare === no;
    });
  }

  return {
    combinedDeduped,
    done,
    todo,
    allRowsCount,
    schema: globalSchema,
    errors,
    hasDoneColumn,
    hasAssetNumberColumn
  };
}

export function exportToCsv(data: CsvRow[], schema: ColumnInfo[]): string {
  const headers = schema.map(s => s.displayName);
  const rows = data.map(row => {
    return schema.map(s => row[s.internalKey] || "");
  });

  return Papa.unparse({
    fields: headers,
    data: rows
  }, {
    quotes: true, // Support standard CSV quoting
  });
}
