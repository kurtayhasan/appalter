const fs = require("fs");
const path = require("path");

const filesToFix = [
  "src/app/api/ai/[slug]/route.ts",
  "src/app/[locale]/[slug]/alternatives/page.tsx",
  "src/app/[locale]/[slug]/page.tsx",
  "src/app/[locale]/[slug]/vs/[alternative_slug]/page.tsx",
  "src/app/[locale]/category/[category_slug]/page.tsx",
  "src/app/ai.json/route.ts",
  "src/app/llms.txt/route.ts",
  "src/app/sitemap-softwares-[page]/route.ts",
  "src/app/sitemap.xml/route.ts",
];

for (const relPath of filesToFix) {
  const fullPath = path.join(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf-8");
    content = content
      .replace(/export const experimental_ppr = true;\r?\n/g, "")
      .replace(/export const dynamic = "force-dynamic";\r?\n/g, "")
      .replace(/export const runtime = "edge";\r?\n/g, "")
      .replace(/export const revalidate = \d+;\s*(?:\/\/.*)?\r?\n/g, "");
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${relPath}`);
  }
}
