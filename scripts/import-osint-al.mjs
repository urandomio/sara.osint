import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const MIRROR_ROOT = '/home/jamesbrink/.openclaw/workspace/tmp/osint.al-mirror/www.osint.al';
const OUT_ROOT = path.resolve('src/pages');

/**
 * Convert a mirror html file path to an Astro route path.
 * - index.html => /
 * - foo/bar.html => /foo/bar
 */
function routeFromMirrorFile(relFile) {
  if (relFile === 'index.html') return '/';
  if (!relFile.endsWith('.html')) return null;
  return '/' + relFile.slice(0, -'.html'.length);
}

function astroFileFromRoute(route) {
  if (route === '/') return path.join(OUT_ROOT, 'index.astro');
  return path.join(OUT_ROOT, route.slice(1) + '.astro');
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function textOf(el) {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim();
}

function rewriteHref(href) {
  if (!href) return href;
  // keep external links
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href;

  // strip query/hash
  const [noHash] = href.split('#');
  const [noQuery] = noHash.split('?');
  let p = noQuery;

  // google sites mirror style
  if (p.endsWith('.html')) p = p.slice(0, -5);
  if (p === 'Welcome' || p === 'Welcome/') p = '';
  if (!p.startsWith('/')) p = '/' + p;

  // normalize double slashes
  p = p.replace(/\/+/g, '/');

  return '/sara.osint' + (p === '/' ? '/' : p);
}

function sanitizeArticleHtml(html, { baseUrl }) {
  const dom = new JSDOM(`<body>${html}</body>`, { url: baseUrl });
  const { document } = dom.window;

  // remove noisy/unsafe tags
  document.querySelectorAll('script, style, iframe, form, button, input, textarea, select, noscript').forEach((n) => n.remove());

  // unwrap spans (google sites uses spans for everything)
  document.querySelectorAll('span').forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
  });

  // turn <div> wrappers into minimal structure where possible by unwrapping
  document.querySelectorAll('div').forEach((div) => {
    // keep if it has meaningful block children? mostly wrappers; unwrap.
    const parent = div.parentNode;
    if (!parent) return;
    while (div.firstChild) parent.insertBefore(div.firstChild, div);
    parent.removeChild(div);
  });

  // Clean attributes on all elements
  document.querySelectorAll('*').forEach((el) => {
    // allowlist some attrs
    const tag = el.tagName.toLowerCase();
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();

      const keep =
        (tag === 'a' && (name === 'href' || name === 'target' || name === 'rel')) ||
        (tag === 'img' && (name === 'src' || name === 'alt' || name === 'width' || name === 'height'));

      if (!keep) el.removeAttribute(attr.name);
    }

    // Rewrite internal links
    if (tag === 'a') {
      const href = el.getAttribute('href');
      if (href) {
        el.setAttribute('href', rewriteHref(href));
      }
      // enforce safe external behavior
      const href2 = el.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href2)) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (tag === 'img') {
      const alt = el.getAttribute('alt');
      if (!alt) el.setAttribute('alt', '');
    }
  });

  // Remove empty paragraphs
  document.querySelectorAll('p').forEach((p) => {
    if (!textOf(p) && p.querySelectorAll('img').length === 0) p.remove();
  });

  return document.body.innerHTML.trim();
}

function extractTitleAndRemove(html, { baseUrl }) {
  const dom = new JSDOM(`<body>${html}</body>`, { url: baseUrl });
  const { document } = dom.window;
  const heading = document.querySelector('h1, h2');
  const title = textOf(heading) || 'Sara\'s OSINT Resources';
  if (heading) heading.remove();
  return { title, html: document.body.innerHTML.trim() };
}

function listHtmlFiles(root) {
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function main() {
  const files = listHtmlFiles(MIRROR_ROOT)
    .map((f) => path.relative(MIRROR_ROOT, f))
    .sort((a, b) => a.localeCompare(b));

  const generated = [];

  for (const relFile of files) {
    const route = routeFromMirrorFile(relFile);
    if (!route) continue;

    // We treat Welcome.html as the same as home; it is effectively a duplicate.
    if (route === '/Welcome') continue;

    const inFile = path.join(MIRROR_ROOT, relFile);
    const html = fs.readFileSync(inFile, 'utf8');

    const baseUrl = 'https://www.osint.al/' + relFile;

    const dom = new JSDOM(html, { url: baseUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.content) {
      console.error(`WARN: no readability content for ${relFile}`);
      continue;
    }

    let cleaned = sanitizeArticleHtml(article.content, { baseUrl });
    const { title, html: bodyHtml } = extractTitleAndRemove(cleaned, { baseUrl });

    // Determine import path depth for BaseLayout
    // page files live under src/pages/** and layouts live under src/layouts
    // so we always need at least one "../" to go from pages -> src.
    // depth = number of subdirectories under src/pages for this route
    // e.g. "/" -> 0, "/foo" -> 0, "/foo/bar" -> 1
    const depth = route === '/' ? 0 : route.slice(1).split('/').length - 1;
    const layoutImport = '../'.repeat(depth + 1) + 'layouts/BaseLayout.astro';

    const astroPath = astroFileFromRoute(route);
    ensureDirForFile(astroPath);

    const pageTitle = `${title} - Sara's OSINT Resources`;

    const out = `---\nimport BaseLayout from '${layoutImport}';\n---\n\n<BaseLayout title=${JSON.stringify(pageTitle)}>\n  <article class=\"surface p-6 sm:p-10 prose prose-invert max-w-none\">\n    <h1 class=\"gradient-text mb-8 text-5xl font-bold\">${title}</h1>\n    <div set:html={${JSON.stringify(bodyHtml)}} />\n  </article>\n</BaseLayout>\n`;

    fs.writeFileSync(astroPath, out);
    generated.push({ route, astroPath: path.relative(process.cwd(), astroPath) });
  }

  console.log(`Generated/updated ${generated.length} pages from osint.al mirror.`);
  for (const g of generated) console.log(`${g.route} -> ${g.astroPath}`);
}

main();
