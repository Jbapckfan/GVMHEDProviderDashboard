# ED Provider Portal Setup Guide

This guide documents the simplest way to turn an existing spreadsheet-based schedule into a clean, reliable source for portals, reports, and exports. It also covers how to embed a maintainable "Critical Phone Numbers" section and a lightweight document library so non-technical staff can keep the portal fresh.

## 1) Normalize the schedule into a portal-friendly tab

1. **Keep the raw schedule untouched.** Assume your matrix-style tab (e.g., `Schedule_Raw`) has provider names in column A, dates across row 1, and shift codes at the intersections.
2. **Create a clean tab** named `Schedule_Normalized` with headers:
   - `Date`
   - `Provider`
   - `Shift`
   - `Location` (optional)
3. **Add an Apps Script** (`Extensions → Apps Script`) and paste:

```javascript
function normalizeSchedule() {
  const RAW_SHEET = 'Schedule_Raw';        // matrix-style schedule tab
  const OUT_SHEET = 'Schedule_Normalized'; // flat table tab

  const ss = SpreadsheetApp.getActive();
  const raw = ss.getSheetByName(RAW_SHEET);
  const out = ss.getSheetByName(OUT_SHEET);

  if (!raw || !out) {
    throw new Error('Missing Schedule_Raw or Schedule_Normalized sheet');
  }

  // Clear previous output except the header row
  out.clearContents();
  out.appendRow(['Date', 'Provider', 'Shift', 'Location']);

  const data = raw.getDataRange().getValues();
  if (data.length < 2 || data[0].length < 2) return;

  const headerRow = data[0];   // dates across columns
  const numRows = data.length;
  const numCols = data[0].length;

  // Loop providers (rows) and dates (columns)
  for (let r = 1; r < numRows; r++) {
    const provider = data[r][0];
    if (!provider) continue;

    for (let c = 1; c < numCols; c++) {
      const date = headerRow[c];
      const shift = data[r][c];

      // Only record non-empty cells
      if (shift && date) {
        out.appendRow([
          new Date(date), // Date
          provider,       // Provider
          shift,          // Shift code
          'ED'            // Location - change if you have multiple sites
        ]);
      }
    }
  }
}
```

4. **Run `normalizeSchedule()`** after schedule updates or add a time-driven trigger (e.g., daily at 02:00) so the normalized tab stays fresh.

The `Schedule_Normalized` sheet now serves as your single source of truth for any downstream use.

## 2) Use the normalized data in your portal

### Google Sites embed

- Create filtered tabs for quick views, e.g., `Schedule_Today`:

```google_sheets
=FILTER(
  Schedule_Normalized!A:D,
  Schedule_Normalized!A:A = TODAY()
)
```

- Or a rolling week view:

```google_sheets
=FILTER(
  Schedule_Normalized!A:D,
  Schedule_Normalized!A:A >= TODAY(),
  Schedule_Normalized!A:A <= TODAY() + 7
)
```

- Embed the filtered tab into Google Sites (Insert → Sheets → choose tab → View as table).

### Optional JSON API

If you need to serve a self-hosted portal (React/Next.js, etc.), convert the normalized tab into a lightweight JSON feed with an Apps Script web app:

```javascript
function doGet(e) {
  const ss = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID');
  const sheet = ss.getSheetByName('Schedule_Normalized');
  const values = sheet.getDataRange().getValues();

  const headers = values.shift();
  const rows = values.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const output = rows.filter(r => {
    const d = new Date(r['Date']);
    const today = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(today.getDate() + 7);
    return d >= today && d <= sevenDays;
  });

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy as a web app, then `fetch` the URL from your portal to render "who's on" for the upcoming week.

## 3) Add a maintainable "Critical Phone Numbers" section

1. **Create a `Phone_Numbers` tab** in the same spreadsheet with columns: `Category`, `Description`, `Number`, `Notes`.
2. **Optional display tab:** create `Phone_Numbers_Display` with:

```google_sheets
=QUERY(Phone_Numbers!A:D,
"select A, B, C, D order by A asc, B asc",
1)
```

3. **Embed in Google Sites:** Insert → Sheets → select the display tab → View as table. This keeps numbers editable by admins without touching the site.

4. **Optional extras:**
   - Add an "Icon" column with simple emoji (☎️, 🚨, 🧪, 🛡) for quick scanning.
   - Pull today's on-call numbers directly from `Schedule_Normalized` with a formula such as:

```google_sheets
=FILTER(Schedule_Normalized!B:C, Schedule_Normalized!A:A = TODAY(), Schedule_Normalized!Shift="CALL")
```

With these pieces in place, your portal stays clean, auto-updating, and easily editable by the team.

## 4) Operations checklist (is this fully functional?)

Follow this quick checklist to ensure the portal is working end-to-end:

1. **Normalize the schedule**
   - Confirm `Schedule_Raw` has providers in column A and dates across row 1.
   - Confirm `Schedule_Normalized` exists with the header row.
   - Run `normalizeSchedule()` once manually; verify rows appear in `Schedule_Normalized`.
   - Add a time-driven trigger (e.g., daily at 02:00) so the normalized tab stays current.

2. **Embed schedule views**
   - Create `Schedule_Today` or `Schedule_Week` with `FILTER` formulas above.
   - In Google Sites, embed those tabs (Insert → Sheets → pick tab → View as table).
   - Verify the embed shows the expected rows for today/this week.

3. **Critical phone numbers**
   - Maintain numbers in `Phone_Numbers`; keep structure `Category | Description | Number | Notes`.
   - Point `Phone_Numbers_Display` to the `QUERY` formula above.
   - Re-embed the display tab in Sites if you create it after initial setup.
   - To add a new number: add a row in `Phone_Numbers`, wait a few seconds, refresh the Site. No code changes needed.

4. **Document library (optional but recommended)**
   - Create a `Documents` tab with columns: `Category | Title | Link | Notes`.
   - Populate with key policies, workflows, tip sheets, and URLs to Google Docs/Drive files.
   - Optional display tab: `Documents_Display` with

```google_sheets
=QUERY(Documents!A:D,
"select A, B, C, D order by A asc, B asc",
1)
```

   - Embed `Documents_Display` into Google Sites (Insert → Sheets → View as table).
   - To add or update a document: edit the `Documents` tab; the embed updates automatically.

5. **Self-hosted portal (if used)**
   - Deploy the `doGet` script as a web app and note the URL.
   - Verify a browser `fetch` returns JSON for the upcoming week.
   - Point your React/Next.js component at that URL and render rows into cards or a table.

Once this checklist passes, the portal is fully functional and editable by non-technical staff—adding phone numbers, schedule updates, or new documents happens entirely in Sheets.
