import fs from 'fs';
import path from 'path';

// Usage: node scripts/ingest.mjs <path-to-json-file>

async function run() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error("Please provide a path to the JSON file to ingest.");
    console.log("Usage: node scripts/ingest.mjs <path-to-json-file>");
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  console.log(`Reading file: ${absolutePath}`);

  try {
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    console.log(`Parsed ${payload.length} records. Sending to ingest API...`);

    const apiUrl = process.env.API_URL || 'http://localhost:3000/api/admin/ingest';
    const secret = process.env.ADMIN_SECRET || 'dev-secret'; // make sure this matches the API logic

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        payload
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Ingest successful:", result);
    } else {
      console.error("❌ Ingest failed:", result);
    }
  } catch (error) {
    console.error("Error during ingestion:", error);
  }
}

run();
