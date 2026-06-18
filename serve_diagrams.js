import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'diagrams.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏥  PenangHealth Diagrams Portal`);
  console.log(`🚀  Localhost Server running at http://localhost:${PORT}`);
  console.log(`📊  Press Ctrl+C to terminate the server\n`);
});
