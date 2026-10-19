// Scroll-animasjon
const observator = new IntersectionObserver((element) => {
    element.forEach((e) => {
        if (e.isIntersecting) {
            e.target.classList.add('synleg');
            observator.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.vis').forEach((el) => observator.observe(el));

// DNS-animasjon
const stega = [
    'Du skriv <b>nrk.no</b>. PC-en sjekkar først om han hugsar svaret (cache). Nei – han må spørje.',
    'PC-en spør <b>DNS-resolveren</b>: «Kva er IP-adressa til nrk.no?»',
    'Resolveren spør <b>rot-serveren</b>. Svar: «Spør .no-serveren!»',
    'Resolveren spør <b>.no-serveren</b>. Svar: «Spør serveren til nrk.no!»',
    '<b>nrk.no-serveren</b> svarar: «IP-adressa er <b>160.68.205.231</b>.» Svaret går tilbake til PC-en, og nettsida lastar! 🎉'
];
const noder = document.querySelectorAll('.node');
const pakke = document.getElementById('pakke');
const forklaring = document.getElementById('forklaring');
const spelAv = document.getElementById('spelAv');
const nesteSteg = document.getElementById('nesteSteg');
let steg = -1;
let timer = null;

function visSteg(n) {
    steg = n;
    noder.forEach((node, i) => node.classList.toggle('aktiv', i === n));
    const node = noder[n];
    const bane = document.getElementById('bane');
    const midt = node.offsetLeft + node.offsetWidth / 2;
    pakke.style.opacity = 1;
    pakke.style.left = midt + 'px';
    pakke.textContent = n === 4 ? '✅' : '✉️';
    forklaring.innerHTML = stega[n];
}

function nesteStegFn() {
    clearInterval(timer);
    timer = null;
    spelAv.textContent = '▶ Spel av';
    visSteg(steg >= 4 ? 0 : steg + 1);
}

spelAv.addEventListener('click', () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
        spelAv.textContent = '▶ Spel av';
        return;
    }
    spelAv.textContent = '⏸ Pause';
    visSteg(0);
    timer = setInterval(() => {
        if (steg >= 4) {
            clearInterval(timer);
            timer = null;
            spelAv.textContent = '↻ Spel av igjen';
            return;
        }
        visSteg(steg + 1);
    }, 2200);
});
nesteSteg.addEventListener('click', nesteStegFn);
window.addEventListener('resize', () => { if (steg >= 0) visSteg(steg); });

// DNS-lab
const kjende = {
    'nrk.no': '160.68.205.231',
    'vg.no': '195.88.54.16',
    'yr.no': '151.101.1.140',
    'google.com': '142.250.74.14',
    'youtube.com': '142.250.74.110',
    'stord.vgs.no': '185.71.212.42',
    'snapchat.com': '34.117.71.2',
    'tiktok.com': '23.62.226.172',
    'wikipedia.org': '185.15.59.224'
};
const cache = {};
const skjema = document.getElementById('labSkjema');
const domeneInput = document.getElementById('domene');
const logg = document.getElementById('logg');
let labKoyrer = false;

function lagIp(namn) {
    let h = 0;
    for (const c of namn) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return [(h % 200) + 20, (h >> 8) % 256, (h >> 16) % 256, ((h >> 24) % 254) + 1].join('.');
}

function ventMs(ms) { return new Promise((r) => setTimeout(r, ms)); }

function skriv(tekst, klasse = '') {
    const p = document.createElement('p');
    p.className = 'linje ' + klasse;
    p.innerHTML = tekst;
    logg.appendChild(p);
}

async function slaaOpp(namn) {
    if (labKoyrer) return;
    namn = namn.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    logg.innerHTML = '';
    if (!/^[a-z0-9æøå-]+(\.[a-z0-9æøå-]+)+$/.test(namn)) {
        skriv('❌ «' + (namn || 'tomt') + '» ser ikkje ut som eit domenenamn. Prøv t.d. <b>nrk.no</b>', 'feil');
        return;
    }
    labKoyrer = true;
    const knapp = skjema.querySelector('button');
    knapp.disabled = true;
    const tld = namn.split('.').pop();
    const ip = kjende[namn] || lagIp(namn);

    skriv('💻 Spør etter <b>' + namn + '</b> …', 'info');
    await ventMs(500);
    if (cache[namn]) {
        skriv('💾 Funne i cache! Ingen grunn til å spørje vidare.', 'ok');
        await ventMs(400);
    } else {
        skriv('💾 Ikkje i cache. Spør DNS-resolveren …');
        await ventMs(700);
        skriv('📡 Resolver → 🌍 rot-server: «Kven har ansvar for .' + tld + '?»');
        await ventMs(800);
        skriv('🌍 Rot-server: «Spør .' + tld + '-serveren.»', 'info');
        await ventMs(800);
        skriv('📡 Resolver → .' + tld + '-server: «Kven har ansvar for ' + namn + '?»');
        await ventMs(800);
        skriv('🏢 Spør namnetenaren til ' + namn + ' …', 'info');
        await ventMs(800);
        cache[namn] = ip;
    }
    const tid = cache[namn] && logg.textContent.includes('Funne i cache') ? 2 : 40 + Math.floor(Math.random() * 60);
    const res = document.createElement('div');
    res.className = 'resultat linje';
    res.innerHTML = '✅ <b>' + namn + '</b> → <b>' + ip + '</b><br><small>Tid: ' + tid + ' ms' +
        (kjende[namn] ? '' : ' · (simulert adresse)') + '</small>';
    logg.appendChild(res);
    knapp.disabled = false;
    labKoyrer = false;
}

skjema.addEventListener('submit', (e) => {
    e.preventDefault();
    slaaOpp(domeneInput.value);
});
document.querySelectorAll('.brikke').forEach((b) => {
    b.addEventListener('click', () => {
        domeneInput.value = b.textContent;
        slaaOpp(b.textContent);
    });
});

// Quiz
const sporsmal = [
    { q: 'Kva gjer DNS?', a: ['Gjer om domenenamn til IP-adresser', 'Lagar nettsider', 'Blokkerer virus', 'Gjer internett raskare med WiFi'], r: 0,
      f: 'DNS slår opp namnet og finn IP-adressa – som ei telefonbok.' },
    { q: 'Kva er ei IP-adresse?', a: ['Eit passord', 'Ei adresse i tal som maskiner brukar', 'Namnet på ei nettside', 'Ein type kabel'], r: 1,
      f: 'IP-adressa er «telefonnummeret» til ein maskin på nettet.' },
    { q: 'Kva er ein DNS-cache?', a: ['Ein virus', 'Eit lager av svar som er lagra ei stund', 'Ein type ruter', 'Ein nettlesar'], r: 1,
      f: 'Cachen hugsar svar, så neste oppslag går mykje raskare.' },
    { q: 'Kven svarar på kven som har ansvar for .no?', a: ['Din PC', 'nrk.no-serveren', 'Rot-serveren', 'Mobilen din'], r: 2,
      f: 'Rot-serveren veit kvar alle toppdomena, som .no og .com, finst.' },
    { q: 'Kvifor brukar vi DNS i staden for berre tal?', a: ['Tal er ulovlege', 'Namn er lettare for menneske å hugse', 'Tal er tregare', 'Det er ingen grunn'], r: 1,
      f: 'Menneske hugsar namn, maskiner brukar tal. DNS koplar dei saman.' }
];
let nr = 0, poeng = 0;
const quizKort = document.getElementById('quizKort');
const quizHTML = quizKort.innerHTML;

function startQuiz() {
    nr = 0; poeng = 0;
    quizKort.innerHTML = quizHTML;
    document.getElementById('nesteSpm').addEventListener('click', () => {
        nr++;
        if (nr < sporsmal.length) visSporsmal(); else visSlutt();
    });
    visSporsmal();
}

function visSporsmal() {
    const s = sporsmal[nr];
    document.getElementById('quizNr').textContent = 'Spørsmål ' + (nr + 1) + ' av ' + sporsmal.length;
    document.getElementById('quizPoeng').textContent = 'Poeng: ' + poeng;
    document.getElementById('framdrift').style.width = (nr / sporsmal.length * 100) + '%';
    document.getElementById('sporsmal').textContent = s.q;
    const tb = document.getElementById('tilbakemelding');
    tb.textContent = ''; tb.className = 'tilbakemelding';
    const neste = document.getElementById('nesteSpm');
    neste.hidden = true;
    neste.textContent = nr === sporsmal.length - 1 ? 'Sjå resultatet →' : 'Neste spørsmål →';
    const svar = document.getElementById('svar');
    svar.innerHTML = '';
    s.a.forEach((tekst, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = tekst;
        b.addEventListener('click', () => vel(i, b));
        svar.appendChild(b);
    });
}

function vel(i, knapp) {
    const s = sporsmal[nr];
    const knappar = document.querySelectorAll('#svar button');
    knappar.forEach((b) => (b.disabled = true));
    knappar[s.r].classList.add('rett');
    const tb = document.getElementById('tilbakemelding');
    if (i === s.r) {
        poeng++;
        tb.textContent = '✅ Rett! ' + s.f;
        tb.className = 'tilbakemelding rett';
    } else {
        knapp.classList.add('gale');
        tb.textContent = '❌ Ikkje heilt. ' + s.f;
        tb.className = 'tilbakemelding gale';
    }
    document.getElementById('quizPoeng').textContent = 'Poeng: ' + poeng;
    document.getElementById('nesteSpm').hidden = false;
}

function visSlutt() {
    const melding = poeng === 5 ? ['🏆', 'Perfekt! Du er ein DNS-ekspert!']
        : poeng >= 3 ? ['🎉', 'Bra jobba! Du kan mykje om DNS.']
        : ['💪', 'God innsats! Bla opp og les litt meir, og prøv igjen.'];
    quizKort.innerHTML = '<div class="sluttresultat"><div class="stor">' + melding[0] + '</div>' +
        '<h3>Du fekk ' + poeng + ' av ' + sporsmal.length + ' poeng</h3>' +
        '<p>' + melding[1] + '</p><br><button class="knapp" id="igjen">↻ Prøv igjen</button></div>';
    document.getElementById('igjen').addEventListener('click', startQuiz);
}

startQuiz();
