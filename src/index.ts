import * as fs from 'fs';
import * as path from 'path';
import { fillPdfForm } from './fillPdf';
import { FormData } from './types';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: ts-node src/index.ts <input.pdf> <data.json> <output.pdf>');
    process.exit(1);
  }

  const [inputPdf, dataJson, outputPdf] = args;

  if (!fs.existsSync(inputPdf)) {
    console.error(`Input PDF not found: ${inputPdf}`);
    process.exit(1);
  }

  if (!fs.existsSync(dataJson)) {
    console.error(`JSON data file not found: ${dataJson}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataJson, 'utf-8');
  const formData: FormData = JSON.parse(raw);

  await fillPdfForm(inputPdf, formData, outputPdf);
  console.log(`Filled PDF written to: ${path.resolve(outputPdf)}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
