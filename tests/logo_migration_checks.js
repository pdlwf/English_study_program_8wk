const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const results = [];

function record(obj){ results.push(obj); }

function read(rel){ return fs.readFileSync(path.join(root, rel), 'utf8'); }

function assert(cond, page, test, message){
  record({page, test, status: cond ? 'PASS':'FAIL', message: cond? '': message});
}

function assertNoLegacyLogoRefs(){
  const files = [
    'index.html',
    ...Array.from({length:8}, (_,i)=>`weeks/week${i+1}.html`),
    'styles/tokens.css','styles/base.css','styles/components.css',
    'scripts/main.js','scripts/router.js',
    'scripts/ui/components.js','scripts/ui/export.js','scripts/ui/timers.js',
    'scripts/ui/quiz.js','scripts/ui/storage.js','scripts/ui/flashcards.js'
  ];
  const legacy = /(assets\/favicon\.svg|assets\/brand\/favicon\.svg|logo\.(png|jpe?g)|data:image\/svg\+xml|longcheer-logo(?!-horiz\.svg|-mark\.svg))/i;
  files.forEach(f=>{
    const text = read(f);
    const match = text.match(legacy);
    assert(!match, f, 'legacy logo scan', match?`Found ${match[0]}`:'');
  });
}

function assertHeaderLogoPresent(file){
  const html = read(file);
  const ok = /<img(?=[^>]*class="[^"]*brand-logo[^"]*")(?=[^>]*src="\/assets\/brand\/longcheer-logo-horiz.svg")(?=[^>]*alt="Longcheer")[^>]*>/i.test(html);
  assert(ok, file, 'header logo present', 'missing or incorrect');
}

function assertFaviconUpdated(file){
  const html = read(file);
  const ok = /<link[^>]*rel="icon"[^>]*href="\/assets\/brand\/longcheer-logo-mark.svg"/i.test(html);
  assert(ok, file, 'favicon updated', 'missing or incorrect');
}

function run(){
  assertNoLegacyLogoRefs();
  assertHeaderLogoPresent('index.html');
  assertHeaderLogoPresent('weeks/week1.html');
  assertFaviconUpdated('index.html');
  assertFaviconUpdated('weeks/week1.html');
  fs.mkdirSync(path.join(root,'REPORTS'),{recursive:true});
  fs.writeFileSync(path.join(root,'REPORTS','logo_migration_report.json'), JSON.stringify(results, null, 2));
  const lines = ['# Logo Migration Report','',`- Timestamp: ${new Date().toISOString()}`,'','| Page | Test | Status | Message |','|------|------|--------|---------|'];
  results.forEach(r=>lines.push(`| ${r.page} | ${r.test} | ${r.status} | ${r.message} |`));
  fs.writeFileSync(path.join(root,'REPORTS','logo_migration_report.md'), lines.join('\n'));
}

run();
