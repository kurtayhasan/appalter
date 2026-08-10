const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function revalidateCache() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://appalter.com';
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET || 'dev-secret';

  const tags = ['categories', 'featured', 'search'];
  
  console.log(`Revalidating cache for ${siteUrl}...`);
  
  for (const tag of tags) {
    try {
      const res = await fetch(`${siteUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, tag })
      });
      
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Successfully revalidated tag: ${tag}`);
      } else {
        console.error(`❌ Failed to revalidate tag ${tag}:`, data);
      }
    } catch (err) {
      console.error(`❌ Error revalidating tag ${tag}:`, err.message);
    }
  }
}

revalidateCache();
