# PDF Form Filler

A lightweight Node/TypeScript application that ingests JSON data to fill out and export a completed **Notice of Small Claim** PDF. Includes a browser-based frontend and an Express server.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

---

## Install Dependencies

```bash
npm install
```

---

## Running the Web App

Start the Express dev server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. Fill out the form and click **Generate & Download PDF** to receive the completed PDF.

---

## CLI Usage

Fill a PDF directly from a JSON file without the web server:

```bash
npx ts-node src/index.ts <input.pdf> <data.json> <output.pdf>
```

**Example:**

```bash
npx ts-node src/index.ts notice-of-small-claim-september-2025.pdf sample-data.json filled-output.pdf
```

See [`sample-data.json`](./sample-data.json) for the full JSON schema reference.

---

## Running Tests

```bash
npm test
```

With coverage report:

```bash
npm run test:coverage
```

---

## Build

Compile TypeScript to JavaScript in `dist/`:

```bash
npm run build
```

---

## Project Structure

```
├── public/
│   └── index.html          # Browser frontend
├── src/
│   ├── fillPdf.ts          # Core PDF fill logic (pdf-lib)
│   ├── index.ts            # CLI entry point
│   ├── server.ts           # Express server + /fill endpoint
│   └── types.ts            # TypeScript types for form data
├── tests/
│   └── fillPdf.test.ts     # Unit tests (Jest)
├── sample-data.json        # Example JSON input
└── notice-of-small-claim-september-2025.pdf
```
