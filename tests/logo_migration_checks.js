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
  const legacy = /(?<!longcheer-)logo[^"']*\.(png|jpe?g|svg)|favicon\.svg|favicon\.ico|data:image\/svg\+xml/gi;
  files.forEach(f => {
    const text = read(f);
    const matches = [...text.matchAll(legacy)];
    const bad = matches.find(m => !m[0].includes('longcheer-logo-horiz.png') && !m[0].includes('longcheer-logo-mark.png'));
    assert(!bad, f, 'legacy logo scan', bad ? `Found ${bad[0]}` : '');
  });
}

function assertHeaderLogo(file){
  const html = read(file);
  const ok = /<img(?=[^>]*class="[^"]*brand-logo[^"]*")(?=[^>]*src="\/assets\/brand\/longcheer-logo-horiz.png")(?=[^>]*alt="Longcheer")[^>]*>/i.test(html);
  assert(ok, file, 'header logo present', 'missing or incorrect');
}

function assertFavicons(file){
  const html = read(file);
  const icon = /<link(?=[^>]*rel="icon")(?=[^>]*href="\/assets\/brand\/longcheer-logo-mark.png")(?=[^>]*type="image\/png")/i.test(html);
  const apple = /<link(?=[^>]*rel="apple-touch-icon")(?=[^>]*href="\/assets\/brand\/longcheer-logo-mark.png")/i.test(html);
  assert(icon && apple, file, 'favicon updated', 'missing or incorrect');
}

function run(){
  assertNoLegacyLogoRefs();
  assertHeaderLogo('index.html');
  assertHeaderLogo('weeks/week1.html');
  assertFavicons('index.html');
  assertFavicons('weeks/week1.html');
  fs.mkdirSync(path.join(root,'REPORTS'),{recursive:true});
  fs.writeFileSync(path.join(root,'REPORTS','logo_migration_report.json'), JSON.stringify(results, null, 2));
  const lines = ['# Logo Migration Report','',`- Timestamp: ${new Date().toISOString()}`,'','| Page | Test | Status | Message |','|------|------|--------|---------|'];
  results.forEach(r=>lines.push(`| ${r.page} | ${r.test} | ${r.status} | ${r.message} |`));
  fs.writeFileSync(path.join(root,'REPORTS','logo_migration_report.md'), lines.join('\n'));
}

run();
