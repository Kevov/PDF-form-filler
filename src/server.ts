import express, { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fillPdfForm, validateFormData } from './fillPdf';
import { FormData } from './types';

const app = express();
const PORT = 3000;
const PDF_PATH = path.join(__dirname, '..', 'notice-of-small-claim-september-2025.pdf');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

if (!fs.existsSync(PDF_PATH)) {
  console.error(`Template PDF not found at: ${PDF_PATH}`);
  process.exit(1);
}

app.post('/fill', async (req: Request, res: Response) => {
  const formData: FormData = req.body;

  if (!formData || typeof formData !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  try {
    validateFormData(formData);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }

  const tmpFile = path.join(os.tmpdir(), `filled-${Date.now()}.pdf`);

  try {
    await fillPdfForm(PDF_PATH, formData, tmpFile);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to generate PDF: ${err.message}` });
    return;
  }

  res.download(tmpFile, 'notice-of-small-claim-filled.pdf', (err) => {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // Temp file already gone — not a problem
    }
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to send PDF file' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
