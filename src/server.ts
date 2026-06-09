import express, { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fillPdfForm } from './fillPdf';
import { FormData } from './types';

const app = express();
const PORT = 3000;
const PDF_PATH = path.join(__dirname, '..', 'notice-of-small-claim-september-2025.pdf');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/fill', async (req: Request, res: Response) => {
  try {
    const formData: FormData = req.body;
    const tmpFile = path.join(os.tmpdir(), `filled-${Date.now()}.pdf`);
    await fillPdfForm(PDF_PATH, formData, tmpFile);
    res.download(tmpFile, 'notice-of-small-claim-filled.pdf', () => {
      fs.unlinkSync(tmpFile);
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
