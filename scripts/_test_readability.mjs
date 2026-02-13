import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const html = fs.readFileSync('/home/jamesbrink/.openclaw/workspace/tmp/osint.al-mirror/www.osint.al/index.html','utf8');
const dom = new JSDOM(html, { url: 'https://www.osint.al/' });
const reader = new Readability(dom.window.document);
const article = reader.parse();
if (!article) {
  console.error('NO ARTICLE');
  process.exit(1);
}
console.log('TITLE:', article.title);
console.log('LEN:', article.textContent.length);
console.log(article.textContent.slice(0,600));
console.log('--- HTML ---');
console.log(article.content.slice(0,600));
