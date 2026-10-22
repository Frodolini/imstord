/* =========================================================
   Gruppe 6 – Lær PowerShell (versjon 2)  |  script.js
   Innhald:
     1. Hjelpefunksjonar
     2. Data: nivå, oppgåver og quiz-spørsmål
     3. Framgang og poeng (lagra i localStorage)
     4. Navigasjon, tema og heimesida
     5. Nivåa («Lær PowerShell») med rask sjekk
     6. Den simulerte terminalen (filsystem, kommandoar, uttrykk)
     7. Oppgåvene (med hint i to steg)
     8. Quizen (vel, byt og sjekk svar)
     9. Oppstart
   Terminalen er ei SIMULERING. Han køyrer aldri ekte kommandoar.
   ========================================================= */
(function () {
    "use strict";

    /* =====================================================
       1. Hjelpefunksjonar
       ===================================================== */
    var $ = function (id) { return document.getElementById(id); };
    var $$ = function (sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); };
    var SVGNS = "http://www.w3.org/2000/svg";
    var roleg = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** Lagar eit HTML-element med klasse og tekst (textContent er trygt mot XSS). */
    function el(tag, klasse, tekst) {
        var e = document.createElement(tag);
        if (klasse) { e.className = klasse; }
        if (tekst !== undefined) { e.textContent = tekst; }
        return e;
    }

    /** Lagar eit ikon frå SVG-spriten i HTML-fila, til dømes ikon("i-hake"). */
    function ikon(id) {
        var s = document.createElementNS(SVGNS, "svg");
        s.setAttribute("class", "ik");
        s.setAttribute("aria-hidden", "true");
        var u = document.createElementNS(SVGNS, "use");
        u.setAttribute("href", "#" + id);
        s.appendChild(u);
        return s;
    }

    /** Knapp med ikon og tekst. */
    function knapp(klasse, ikonId, tekst) {
        var b = el("button", klasse);
        b.type = "button";
        if (ikonId) { b.appendChild(ikon(ikonId)); }
        b.appendChild(el("span", "", tekst));
        return b;
    }

    /** Stokkar ei liste tilfeldig (Fisher-Yates). */
    function stokk(liste) {
        var a = liste.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /** Kort melding nede på skjermen, til dømes «+10 poeng». */
    var toastTimer = null;
    function toast(tekst, ikonId) {
        var t = $("toast");
        t.textContent = "";
        t.appendChild(ikon(ikonId || "i-stjerne"));
        t.appendChild(el("span", "", tekst));
        t.classList.add("vis");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove("vis"); }, 2400);
    }

    /** Litt konfetti når eleven gjer det bra. */
    function konfetti(tal) {
        if (roleg) { return; }
        var fargar = ["#3b82f6", "#0fb5ae", "#8b5cf6", "#ec4899", "#fbbf24", "#5eead4"];
        for (var i = 0; i < (tal || 70); i++) {
            var c = el("span", "konfetti");
            c.style.left = (Math.random() * 100) + "vw";
            c.style.background = fargar[i % fargar.length];
            c.style.animationDuration = (2 + Math.random() * 2) + "s";
            c.style.animationDelay = (Math.random() * 0.5) + "s";
            document.body.appendChild(c);
            (function (e) { setTimeout(function () { e.remove(); }, 4800); })(c);
        }
    }

    /* =====================================================
       2. Data
       ===================================================== */

    /*
      Kvart nivå har:
        intro : kort forklaring (1–2 setningar)
        hugs  : huskeregel
        eks   : eksempel (kode, kort forklaring, kommando som kan prøvast i terminalen)
        sjekk : eit raskt spørsmål som må svarast rett før nivået kan fullførast
    */
    var NIVAA = [
        {
            tittel: "Kva er PowerShell?", ikon: "i-lyspære", farge: "bla",
            intro: "Du skriv ein kommando, trykker Enter og får svar. Kommandoane heiter <strong>cmdlets</strong> og er alltid bygde som <strong>Verb-Substantiv</strong>.",
            hugs: "<span class='kodeinline'>Get-Date</span> betyr «hent dato». Verbet seier <em>kva</em> som skjer, substantivet seier <em>med kva</em>.",
            eks: [
                { kode: "Get-Date", forklaring: "Viser dato og klokkeslett.", prov: "Get-Date" }
            ],
            sjekk: { q: "Kva betyr «Get» i Get-Date?", a: ["Hent", "Slett", "Lag"], r: 0, f: "Get betyr «hent». Get-Date hentar datoen." }
        },
        {
            tittel: "Grunnleggjande kommandoar", ikon: "i-terminal", farge: "turkis",
            intro: "Fire kommandoar du får bruk for heile tida.",
            hugs: "Står du fast? Skriv <span class='kodeinline'>Get-Help</span> og namnet på kommandoen.",
            eks: [
                { kode: "Get-Location", forklaring: "Kvar er eg no?", prov: "Get-Location" },
                { kode: "Get-Command", forklaring: "Kva kommandoar finst?", prov: "Get-Command" },
                { kode: "Get-Help Get-Date", forklaring: "Hjelp om ein kommando.", prov: "Get-Help Get-Date" },
                { kode: "Write-Host \"Hei, verda!\"", forklaring: "Skriv tekst på skjermen.", prov: "Write-Host \"Hei, verda!\"" }
            ],
            sjekk: { q: "Kva kommando skriv tekst på skjermen?", a: ["Get-Location", "Write-Host", "Get-Command"], r: 1, f: "Write-Host skriv ut teksten du gir han." }
        },
        {
            tittel: "Navigere i mapper", ikon: "i-mappe", farge: "lilla",
            intro: "Mapper er som rom i eit hus. Du startar i rommet <span class='kodeinline'>C:\\Brukarar\\Elev</span>.",
            hugs: "To punktum <span class='kodeinline'>..</span> betyr alltid «mappa over».",
            eks: [
                { kode: "Get-ChildItem", forklaring: "Kva ligg i mappa?", prov: "Get-ChildItem" },
                { kode: "Set-Location Dokument", forklaring: "Gå inn i mappa Dokument.", prov: "Set-Location Dokument" },
                { kode: "Set-Location ..", forklaring: "Gå eitt steg opp igjen.", prov: "Set-Location .." }
            ],
            sjekk: { q: "Du står i Dokument. Kva tek deg eitt steg opp?", a: ["Get-ChildItem", "Set-Location Dokument", "Set-Location .."], r: 2, f: "Set-Location .. flyttar deg til mappa over." }
        },
        {
            tittel: "Lage filer og mapper", ikon: "i-fil", farge: "bla",
            intro: "<span class='kodeinline'>New-Item</span> lagar nye ting. Med <span class='kodeinline'>-ItemType</span> vel du <strong>Directory</strong> (mappe) eller <strong>File</strong> (fil).",
            hugs: "Parametrar som <span class='kodeinline'>-Name</span> og <span class='kodeinline'>-ItemType</span> startar alltid med minus.",
            eks: [
                { kode: "New-Item -Name Prosjekt -ItemType Directory", forklaring: "Lagar mappa Prosjekt.", prov: "New-Item -Name Prosjekt -ItemType Directory" },
                { kode: "New-Item -Name hei.txt -ItemType File -Value \"Hei PowerShell\"", forklaring: "Lagar fila hei.txt med tekst i.", prov: "New-Item -Name hei.txt -ItemType File -Value \"Hei PowerShell\"" },
                { kode: "Get-Content hei.txt", forklaring: "Les kva som står i fila.", prov: "Get-Content hei.txt" },
                { kode: "Remove-Item hei.txt", forklaring: "Slettar fila. Ver forsiktig på ei ekte maskin!", prov: "Remove-Item hei.txt" }
            ],
            sjekk: { q: "Kva -ItemType gir ei mappe?", a: ["File", "Directory", "Folder"], r: 1, f: "Directory betyr mappe. File betyr fil." }
        },
        {
            tittel: "Variablar og skript", ikon: "i-boks", farge: "turkis",
            intro: "Ein <strong>variabel</strong> er ei eske som tek vare på ein verdi. Namnet startar alltid med <span class='kodeinline'>$</span>.",
            hugs: "Eit <strong>skript</strong> er fleire kommandoar lagra i ei fil som endar på <span class='kodeinline'>.ps1</span>.",
            eks: [
                { kode: "$namn = \"Ola\"", forklaring: "Legg teksten «Ola» i eska $namn.", prov: "$namn = \"Ola\"" },
                { kode: "Write-Host \"Hei $namn\"", forklaring: "Blir til «Hei Ola».", prov: "Write-Host \"Hei $namn\"" },
                { kode: "5 + 3", forklaring: "PowerShell kan rekne. Svaret blir 8.", prov: "5 + 3" },
                { kode: "foreach ($tal in 1..3) { Write-Host \"Runde $tal\" }", forklaring: "Ei løkke gjer det same fleire gonger.", prov: "foreach ($tal in 1..3) { Write-Host \"Runde $tal\" }" },
                { kode: "# Fila hils.ps1\n$namn = Read-Host \"Kva heiter du\"\nWrite-Host \"Velkomen, $namn!\"", forklaring: "Eit lite skript. Linja med # er ein kommentar. (Dette kan ikkje køyrast her.)", prov: null }
            ],
            sjekk: { q: "Kva teikn startar alle variablar?", a: ["#", "$", "%"], r: 1, f: "Variablar startar med $, til dømes $namn." }
        }
    ];

    /* Oppgåver i terminalen. «sjekk» får tilstanden og seier om oppgåva er løyst. */
    var OPPG = [
        { id: "dato", tekst: "Vis dagens dato.", hint: "Kommandoen startar med «Get-» og handlar om dato.",
          losning: ["Get-Date"],
          sjekk: function (s) { return s.sisteKmd === "get-date" && s.sisteOk; } },
        { id: "mappe", tekst: "Gå inn i mappa Dokument.", hint: "Bruk Set-Location og namnet på mappa. Get-ChildItem viser kva mapper som finst.",
          losning: ["Set-Location C:\\Brukarar\\Elev\\Dokument"],
          sjekk: function (s) { return s.cwd.join("\\").toLowerCase() === "c:\\brukarar\\elev\\dokument"; } },
        { id: "nymappe", tekst: "Lag ei ny mappe som heiter Prosjekt.", hint: "Bruk New-Item med -Name og -ItemType Directory.",
          losning: ["New-Item -Name Prosjekt -ItemType Directory"],
          sjekk: function () { return !!finnNoko("Prosjekt", "dir"); } },
        { id: "nyfil", tekst: "Lag fila hei.txt med teksten «Hei PowerShell».", hint: "Bruk New-Item med -ItemType File og -Value.",
          losning: ["New-Item -Name hei.txt -ItemType File -Value \"Hei PowerShell\""],
          sjekk: function () { var f = finnNoko("hei.txt", "file"); return !!f && /hei/i.test(f.content || ""); } },
        { id: "variabel", tekst: "Lag variabelen $namn med namnet ditt, og skriv han ut.", hint: "To steg: lag variabelen først, og skriv han så ut med Write-Host.",
          losning: ["$namn = \"Ola\"", "Write-Host $namn"],
          sjekk: function (s) { return s.namnUtskrift; } }
    ];

    /* Quiz-spørsmål: a = svaralternativ, r = indeks til rett svar, f = kort forklaring */
    var SPM = [
        { q: "Kva er PowerShell?", a: ["Eit spel frå Microsoft", "Eit verktøy for å styre datamaskina med kommandoar", "Ein nettlesar"], r: 1, f: "PowerShell er eit kommandoverktøy og skriptspråk frå Microsoft." },
        { q: "Korleis er cmdlets bygde opp?", a: ["Verb-Substantiv, som Get-Date", "Berre tal", "Substantiv_Verb_Tal"], r: 0, f: "Verb-Substantiv. Get-Date betyr «hent dato»." },
        { q: "Kva kommando viser kva som ligg i ei mappe?", a: ["Get-ChildItem", "Show-Folder", "Set-Location"], r: 0, f: "Get-ChildItem viser filer og mapper der du står." },
        { q: "Kva gjer Set-Location ..?", a: ["Slettar mappa", "Går eitt steg opp", "Lagar ei ny mappe"], r: 1, f: ".. betyr mappa over." },
        { q: "Kva kommando lagar ei ny mappe?", a: ["New-Item -ItemType Directory", "Make-Folder", "Create-File"], r: 0, f: "New-Item med -ItemType Directory lagar ei mappe." },
        { q: "Kva teikn startar namnet på ein variabel?", a: ["#", "$", "%"], r: 1, f: "Variablar startar med $, til dømes $namn." },
        { q: "Kva gjer Get-Content notat.txt?", a: ["Slettar fila", "Viser innhaldet i fila", "Lagar fila"], r: 1, f: "Get-Content les fila og viser innhaldet." },
        { q: "Kva gjer Remove-Item?", a: ["Slettar ei fil eller mappe", "Kopierer ei fil", "Gir nytt namn"], r: 0, f: "Remove-Item slettar. Ver forsiktig!" },
        { q: "Kva kommando skriv ut tekst på skjermen?", a: ["Print-Text", "Write-Host", "Say-Text"], r: 1, f: "Write-Host \"Hei\" skriv ut Hei." },
        { q: "Kva fil-ending har eit PowerShell-skript?", a: [".exe", ".ps1", ".doc"], r: 1, f: "PowerShell-skript endar på .ps1." },
        { q: "Kva brukar du for å få hjelp om ein kommando?", a: ["Get-Help", "Ask-Teacher", "Show-Manual"], r: 0, f: "Get-Help pluss kommandonamnet gir ei forklaring." }
    ];

    /* =====================================================
       3. Framgang og poeng (localStorage)
       ===================================================== */
    var LAGRINGSNOKKEL = "gruppe6-framgang-v2";
    var GAMMAL_NOKKEL = "gruppe6-framgang-v1";
    var state = { nivaa: [], oppg: [], quiz: [], tema: "light", sist: 0 };

    function lagre() {
        try { localStorage.setItem(LAGRINGSNOKKEL, JSON.stringify(state)); } catch (e) { /* lagring kan vere avslått */ }
    }

    function gyldigListe(liste, maks) {
        if (!Array.isArray(liste)) { return []; }
        return liste.filter(function (x) { return typeof x === "number" && x >= 0 && x < maks; })
            .filter(function (x, i, a) { return a.indexOf(x) === i; });
    }

    function lastFramgang() {
        try {
            var raa = localStorage.getItem(LAGRINGSNOKKEL);
            var nyVersjon = !!raa;
            if (!raa) { raa = localStorage.getItem(GAMMAL_NOKKEL); } // ta med framgang frå prototypen
            if (!raa) { return; }
            var o = JSON.parse(raa);
            state.nivaa = gyldigListe(o.nivaa, NIVAA.length);
            state.oppg = (Array.isArray(o.oppg) ? o.oppg : []).filter(function (id, i, a) {
                return OPPG.some(function (x) { return x.id === id; }) && a.indexOf(id) === i;
            });
            state.quiz = gyldigListe(o.quiz, SPM.length);
            state.tema = nyVersjon && o.tema === "dark" ? "dark" : "light";
            state.sist = typeof o.sist === "number" && o.sist >= 0 && o.sist < NIVAA.length ? o.sist : 0;
            if (!nyVersjon) { lagre(); }
        } catch (e) { /* ugyldig data: start på nytt */ }
    }

    function poeng() { return state.nivaa.length * 10 + state.oppg.length * 20 + state.quiz.length * 10; }
    function totalt() { return NIVAA.length + OPPG.length + SPM.length; }
    function ferdige() { return state.nivaa.length + state.oppg.length + state.quiz.length; }

    var forrigePoeng = null;
    function oppdaterTopp() {
        var pst = Math.round(ferdige() / totalt() * 100);
        var p = poeng();
        $("poengVis").textContent = String(p);
        if (forrigePoeng !== null && p > forrigePoeng && !roleg) {
            var m = document.querySelector(".poengmerke");
            m.classList.remove("dunk"); void m.offsetWidth; m.classList.add("dunk");
        }
        forrigePoeng = p;
        $("framdriftBar").style.width = pst + "%";
        $("framdriftRot").setAttribute("aria-valuenow", String(pst));
        $("framdriftTekst").textContent = pst + " %";
        oppdaterHeim();
    }

    /* =====================================================
       4. Navigasjon, tema og heimesida
       ===================================================== */
    var VISNINGAR = ["heim", "laer", "terminal", "quiz"];

    function gaaTil(id, oppdaterHash) {
        if (VISNINGAR.indexOf(id) === -1) { id = "heim"; }
        $$(".visning").forEach(function (s) { s.classList.toggle("aktiv", s.id === id); });
        $$(".meny button").forEach(function (b) {
            var aktiv = b.getAttribute("data-visning") === id;
            b.classList.toggle("aktiv", aktiv);
            if (aktiv) { b.setAttribute("aria-current", "page"); } else { b.removeAttribute("aria-current"); }
        });
        if (oppdaterHash !== false && history.replaceState) { history.replaceState(null, "", "#" + id); }
        window.scrollTo({ top: 0, behavior: roleg ? "auto" : "smooth" });
        if (id === "terminal") { setTimeout(rullNed, 50); }
    }

    function settTema(tema) {
        state.tema = tema;
        document.documentElement.setAttribute("data-tema", tema);
        var mork = tema === "dark";
        $("temaIkon").firstChild.setAttribute("href", mork ? "#i-sol" : "#i-maane");
        $("temaKnapp").setAttribute("aria-pressed", mork ? "true" : "false");
        $("temaKnapp").setAttribute("aria-label", mork ? "Byt til lys modus" : "Byt til mørk modus");
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) { meta.setAttribute("content", mork ? "#0e1330" : "#f4f8ff"); }
        lagre();
    }

    /** Det første nivået som ikkje er fullført (eller -1 om alle er ferdige). */
    function forsteUferdigeNivaa() {
        for (var i = 0; i < NIVAA.length; i++) { if (state.nivaa.indexOf(i) === -1) { return i; } }
        return -1;
    }

    function oppdaterHeim() {
        function sett(id, ferdig, av) {
            $(id).style.width = (ferdig / av * 100) + "%";
            $(id + "Tal").textContent = ferdig + "/" + av;
        }
        sett("frNivaa", state.nivaa.length, NIVAA.length);
        sett("frOppg", state.oppg.length, OPPG.length);
        sett("frQuiz", state.quiz.length, SPM.length);

        var tekst = $("fortsetKnapp").lastChild;
        var neste = forsteUferdigeNivaa();
        if (ferdige() === 0) { tekst.textContent = "Start kurset"; }
        else if (neste !== -1) { tekst.textContent = "Hald fram: nivå " + (neste + 1); }
        else if (state.oppg.length < OPPG.length) { tekst.textContent = "Hald fram: oppgåver"; }
        else { tekst.textContent = "Ta quizen"; }
    }

    function fortset() {
        var neste = forsteUferdigeNivaa();
        if (neste !== -1) { visNivaa(neste); gaaTil("laer"); }
        else if (state.oppg.length < OPPG.length) { gaaTil("terminal"); }
        else { gaaTil("quiz"); }
    }

    /* Animert terminal på framsida: skriv kommandoar bokstav for bokstav */
    var HERO_DEMO = [
        { kmd: "Get-Date", kl: "k", ut: "torsdag 22. oktober 2026 09:41:07" },
        { kmd: "Write-Host \"Hei, verda!\"", kl: "k", ut: "Hei, verda!" },
        { kmd: "$namn = \"Ola\"", kl: "s", ut: null },
        { kmd: "Write-Host \"Velkomen, $namn!\"", kl: "k", ut: "Velkomen, Ola!" }
    ];
    function startHeroDemo() {
        var pre = $("heroKode");
        HERO_DEMO[0].ut = CMDS["get-date"]("")[0]; // same dato-format som i terminalen

        function prompt() { return "<span class='p'>PS C:\\Brukarar\\Elev&gt;</span> "; }
        function farg(kmd) { return fargeleggKode(kmd).replace(/t-kmd/g, "k").replace(/t-str/g, "s"); }

        if (roleg) {
            pre.innerHTML = HERO_DEMO.map(function (d) { return prompt() + farg(d.kmd) + (d.ut ? "\n<span class='o'>" + d.ut + "</span>" : ""); }).join("\n") + "\n" + prompt() + "<span class='markor'></span>";
            return;
        }
        var ferdig = "", linje = 0, teikn = 0;
        function tikk() {
            if (linje >= HERO_DEMO.length) {
                setTimeout(function () { ferdig = ""; linje = 0; teikn = 0; tikk(); }, 4000);
                return;
            }
            var d = HERO_DEMO[linje];
            if (teikn <= d.kmd.length) {
                pre.innerHTML = ferdig + prompt() + farg(d.kmd.slice(0, teikn)) + "<span class='markor'></span>";
                teikn++;
                setTimeout(tikk, 45 + Math.random() * 60);
            } else {
                ferdig += prompt() + farg(d.kmd) + "\n" + (d.ut ? "<span class='o'>" + d.ut + "</span>\n" : "");
                pre.innerHTML = ferdig + prompt() + "<span class='markor'></span>";
                linje++; teikn = 0;
                setTimeout(tikk, 900);
            }
        }
        tikk();
    }

    /* =====================================================
       5. Nivåa
       ===================================================== */

    /** Fargelegg kode: kommandoar, parametrar, tekst, variablar og kommentarar. */
    function fargeleggKode(tekst) {
        var ut = tekst.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return ut.replace(/(#.*$)|("[^"]*"|'[^']*')|(\$\w+)|(\b[A-Z][a-z]+-[A-Z][A-Za-z]+\b)|(\s-[A-Za-z]+)/gm, function (m, kom, str, vari, kmd, par) {
            if (kom) { return "<span class='t-kom'>" + kom + "</span>"; }
            if (str) { return "<span class='t-str'>" + str + "</span>"; }
            if (vari) { return "<span class='t-var'>" + vari + "</span>"; }
            if (kmd) { return "<span class='t-kmd'>" + kmd + "</span>"; }
            return "<span class='t-par'>" + par + "</span>";
        });
    }

    var sjekkRett = {}; // nivå der den raske sjekken er svart rett i denne økta

    function byggStegar() {
        var ol = $("nivaaStegar");
        ol.textContent = "";
        NIVAA.forEach(function (n, i) {
            var li = el("li");
            var b = el("button", "steg-knapp");
            b.type = "button";
            var ferdig = state.nivaa.indexOf(i) !== -1;
            if (ferdig) { b.classList.add("ferdig"); }
            if (i === state.sist) { b.classList.add("valt"); b.setAttribute("aria-current", "step"); }
            var nr = el("span", "steg-nr");
            if (ferdig) { nr.appendChild(ikon("i-hake")); } else { nr.textContent = String(i + 1); }
            b.appendChild(nr);
            var t = el("span", "steg-tekst");
            t.appendChild(el("small", "", "Nivå " + (i + 1)));
            t.appendChild(el("span", "", n.tittel));
            b.appendChild(t);
            b.setAttribute("aria-label", "Nivå " + (i + 1) + ": " + n.tittel + (ferdig ? " (fullført)" : ""));
            b.addEventListener("click", function () { visNivaa(i); });
            li.appendChild(b);
            ol.appendChild(li);
        });
    }

    function visNivaa(i) {
        state.sist = i;
        lagre();
        byggStegar();

        var n = NIVAA[i];
        var ferdig = state.nivaa.indexOf(i) !== -1;
        var vis = $("nivaaVisning");
        vis.textContent = "";
        var kort = el("article", "kort nivaa-kort");

        /* Toppen */
        var hovud = el("div", "nivaa-hovud");
        var ib = el("span", "ikonboks " + n.farge);
        ib.appendChild(ikon(n.ikon));
        hovud.appendChild(ib);
        var tittel = el("div");
        tittel.appendChild(el("small", "", "Nivå " + (i + 1) + " av " + NIVAA.length));
        tittel.appendChild(el("h3", "", n.tittel));
        hovud.appendChild(tittel);
        if (ferdig) {
            var fm = el("span", "ferdig-merke");
            fm.appendChild(ikon("i-hake"));
            fm.appendChild(el("span", "", "Fullført"));
            hovud.appendChild(fm);
        }
        kort.appendChild(hovud);

        /* Kort forklaring og huskeregel (teksten er skriven av oss, ikkje av brukaren) */
        var intro = el("p", "nivaa-intro");
        intro.innerHTML = n.intro;
        kort.appendChild(intro);

        var hugs = el("div", "hugs");
        hugs.appendChild(ikon("i-lyspære"));
        var hp = el("p");
        hp.innerHTML = "<strong>Hugs:</strong> " + n.hugs;
        hugs.appendChild(hp);
        kort.appendChild(hugs);

        /* Eksempel */
        var liste = el("div", "eks-liste");
        n.eks.forEach(function (e) {
            var boks = el("div", "eks");
            var pre = el("pre", "kode");
            pre.innerHTML = fargeleggKode(e.kode);
            boks.appendChild(pre);
            var under = el("div", "eks-under");
            under.appendChild(el("p", "", e.forklaring));
            if (e.prov) {
                var pb = knapp("prov-knapp", "i-spel", "Prøv i terminalen");
                pb.addEventListener("click", function () { provITerminal(e.prov); });
                under.appendChild(pb);
            }
            boks.appendChild(under);
            liste.appendChild(boks);
        });
        kort.appendChild(liste);

        /* Rask sjekk */
        var rs = el("div", "rask-sjekk");
        var h4 = el("h4");
        h4.appendChild(ikon("i-mal"));
        h4.appendChild(el("span", "", "Rask sjekk"));
        rs.appendChild(h4);
        rs.appendChild(el("p", "sporsmal", n.sjekk.q));
        var alt = el("div", "sjekk-alt");
        var fb = el("p", "sjekk-fb");
        fb.setAttribute("aria-live", "polite");
        var loyst = ferdig || sjekkRett[i];
        n.sjekk.a.forEach(function (svar, ai) {
            var b = el("button", "", svar);
            b.type = "button";
            if (loyst) {
                b.disabled = true;
                if (ai === n.sjekk.r) { b.classList.add("rett"); }
            }
            b.addEventListener("click", function () {
                if (ai === n.sjekk.r) {
                    sjekkRett[i] = true;
                    $$("button", alt).forEach(function (x) { x.disabled = true; x.classList.remove("feil"); });
                    b.classList.add("rett");
                    fb.className = "sjekk-fb ok";
                    fb.textContent = "Rett! " + n.sjekk.f + (ferdig ? "" : " No kan du fullføre nivået.");
                    fullfor.disabled = ferdig;
                    if (!ferdig) { fullfor.focus(); }
                } else {
                    b.classList.remove("feil"); void b.offsetWidth; b.classList.add("feil");
                    b.disabled = true;
                    fb.className = "sjekk-fb nei";
                    fb.textContent = "Ikkje heilt. Prøv eit anna svar!";
                }
            });
            alt.appendChild(b);
        });
        if (loyst) { fb.className = "sjekk-fb ok"; fb.textContent = "Rett! " + n.sjekk.f; }
        rs.appendChild(alt);
        rs.appendChild(fb);
        kort.appendChild(rs);

        /* Navigering og fullføring */
        var nav = el("div", "nivaa-nav");
        var forrige = knapp("knapp sek liten-knapp", "i-pil-v", "Førre");
        forrige.disabled = i === 0;
        forrige.addEventListener("click", function () { visNivaa(i - 1); scrollTilLaer(); });
        nav.appendChild(forrige);

        var midt = el("div", "midt");
        var fullfor = knapp("knapp" + (ferdig ? " ferdig" : ""), "i-hake", ferdig ? "Fullført" : "Fullfør nivået (+10)");
        fullfor.disabled = ferdig || !sjekkRett[i];
        fullfor.title = ferdig ? "" : "Svar rett på den raske sjekken først";
        fullfor.addEventListener("click", function () {
            if (state.nivaa.indexOf(i) !== -1) { return; }
            state.nivaa.push(i);
            lagre();
            oppdaterTopp();
            toast("+10 poeng! Nivå " + (i + 1) + " er fullført");
            if (state.nivaa.length === NIVAA.length) { konfetti(90); toast("Alle fem nivåa er fullførte!", "i-pokal"); }
            visNivaa(i);
        });
        midt.appendChild(fullfor);
        nav.appendChild(midt);

        var siste = i === NIVAA.length - 1;
        var neste = knapp("knapp " + (siste ? "turkis" : "sek") + " liten-knapp", siste ? "i-terminal" : "i-pil-h", siste ? "Til oppgåvene" : "Neste");
        neste.addEventListener("click", function () {
            if (siste) { gaaTil("terminal"); } else { visNivaa(i + 1); scrollTilLaer(); }
        });
        nav.appendChild(neste);
        kort.appendChild(nav);

        vis.appendChild(kort);
    }

    function scrollTilLaer() {
        var topp = $("nivaaVisning").getBoundingClientRect().top + window.pageYOffset - 140;
        if (window.pageYOffset > topp) { window.scrollTo({ top: Math.max(0, topp), behavior: roleg ? "auto" : "smooth" }); }
    }

    /** Opnar terminalen og fyller inn ein kommando, klar til å trykke Enter. */
    function provITerminal(kmd) {
        gaaTil("terminal");
        var inn = $("termInn");
        inn.value = kmd;
        setTimeout(function () { inn.focus(); inn.setSelectionRange(kmd.length, kmd.length); }, 300);
        toast("Trykk Enter for å køyre kommandoen", "i-terminal");
    }

    /* =====================================================
       6. Den simulerte terminalen
       ===================================================== */

    var DAGAR = ["søndag", "måndag", "tysdag", "onsdag", "torsdag", "fredag", "laurdag"];
    var MANADER = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

    var fs;                       // filsystemet (ei trestruktur i minnet)
    var cwd;                      // gjeldande mappe, som liste: ["C:", "Brukarar", "Elev"]
    var vars;                     // variablar laga av eleven
    var term = { namnUtskrift: false, sisteKmd: "", sisteOk: false };
    var historikk = [];
    var histPos = 0;

    /** Byggjer eit lite filsystem som eleven kan utforske. */
    function nyttFilsystem() {
        var no = new Date();
        function mappe() { return { type: "dir", children: {}, tid: no }; }
        function fil(innhald) { return { type: "file", content: innhald, tid: no }; }
        var elev = mappe();
        elev.children.Dokument = mappe();
        elev.children.Skrivebord = mappe();
        elev.children.Bilete = mappe();
        elev.children["notat.txt"] = fil("Hugs å øve på PowerShell!");
        var brukarar = mappe(); brukarar.children.Elev = elev;
        var c = mappe();
        c.children.Brukarar = brukarar;
        c.children.Windows = mappe();
        c.children.Programfiler = mappe();
        var rot = mappe();
        rot.children["C:"] = c;
        return rot;
    }

    function nullstillTerminalTilstand() {
        fs = nyttFilsystem();
        cwd = ["C:", "Brukarar", "Elev"];
        vars = {};
        term = { namnUtskrift: false, sisteKmd: "", sisteOk: false };
    }

    /* ----- Hjelp for stiar ----- */

    function finnNokkel(node, namn) {
        var lavt = namn.toLowerCase();
        var nøklar = Object.keys(node.children);
        for (var i = 0; i < nøklar.length; i++) { if (nøklar[i].toLowerCase() === lavt) { return nøklar[i]; } }
        return null;
    }

    /** Går gjennom ei liste med namn og gir tilbake noden og stien med rett stor/liten bokstav. */
    function gaaGjennom(delar) {
        var node = fs, kanon = [];
        for (var i = 0; i < delar.length; i++) {
            if (node.type !== "dir") { return null; }
            var nokkel = finnNokkel(node, delar[i]);
            if (!nokkel) { return null; }
            kanon.push(nokkel);
            node = node.children[nokkel];
        }
        return { node: node, delar: kanon };
    }

    /** Gjer om ein tekst-sti til ei liste med delar, med utgangspunkt i gjeldande mappe. */
    function losSti(sti) {
        var s = sti.replace(/\//g, "\\");
        var delar = /^[A-Za-z]:/.test(s) ? [] : cwd.slice();
        s.split("\\").forEach(function (seg) {
            if (seg === "" || seg === ".") { return; }
            if (seg === "..") { if (delar.length > 1) { delar.pop(); } return; }
            delar.push(seg);
        });
        if (delar.length > 0) { delar[0] = delar[0].toUpperCase(); }
        return delar;
    }

    /** Leitar rekursivt etter ei fil/mappe med eit namn inni Elev-mappa (brukt av oppgåvene). */
    function finnNoko(namn, type) {
        var start = gaaGjennom(["C:", "Brukarar", "Elev"]);
        if (!start) { return null; }
        var treff = null;
        (function leit(node) {
            Object.keys(node.children || {}).forEach(function (k) {
                var barn = node.children[k];
                if (k.toLowerCase() === namn.toLowerCase() && barn.type === type && !treff) { treff = barn; }
                if (barn.type === "dir") { leit(barn); }
            });
        })(start.node);
        return treff;
    }

    function stiTekst(delar) { return delar.length === 1 ? delar[0] + "\\" : delar.join("\\"); }
    function to(n) { return n < 10 ? "0" + n : String(n); }
    function datoKort(d) { return to(d.getDate()) + "." + to(d.getMonth() + 1) + "." + d.getFullYear() + "     " + to(d.getHours()) + ":" + to(d.getMinutes()); }

    /* ----- Feilmeldingar ----- */

    /** Ei feil med ei ekte PowerShell-lik melding (msg) og eit hint på nynorsk (hint). */
    function PSFeil(msg, hint) { this.msg = msg; this.hint = hint; }

    function ikkjeFunnet(sti) {
        return new PSFeil("Cannot find path '" + sti + "' because it does not exist.",
            "Stien finst ikkje. Sjekk stavinga og kva mappe du står i. Bruk Get-ChildItem for å sjå kva som finst her.");
    }

    /* ----- Teikn-for-teikn lesing av argument ----- */

    /** Delar ein tekst i bitar, og held tekst i hermeteikn saman. */
    function tokeniser(tekst) {
        var res = [], re = /"[^"]*"|'[^']*'|\S+/g, m;
        while ((m = re.exec(tekst)) !== null) {
            var t = m[0], q = "";
            if (t.charAt(0) === '"' && t.charAt(t.length - 1) === '"' && t.length >= 2) { q = '"'; t = t.slice(1, -1); }
            else if (t.charAt(0) === "'" && t.charAt(t.length - 1) === "'" && t.length >= 2) { q = "'"; t = t.slice(1, -1); }
            res.push({ t: t, q: q });
        }
        return res;
    }

    /** Set inn variabelverdiar i tekst med dobbelt hermeteikn: "Hei $namn". */
    function interpoler(tekst) {
        return tekst.replace(/\$(\w+)/g, function (m, n) { return Object.prototype.hasOwnProperty.call(vars, n.toLowerCase()) ? String(vars[n.toLowerCase()]) : ""; });
    }

    function verdiAv(tok) {
        if (tok.q === '"') { return interpoler(tok.t); }
        if (tok.q === "'") { return tok.t; }
        var vm = /^\$(\w+)$/.exec(tok.t);
        if (vm) { return Object.prototype.hasOwnProperty.call(vars, vm[1].toLowerCase()) ? String(vars[vm[1].toLowerCase()]) : ""; }
        return tok.t;
    }

    /**
     * Les parametrar. «flagg» er parametrar utan verdi (som -Recurse).
     * «kjende» er alle gyldige parametrar for kommandoen (for å gi hint om feilstaving).
     */
    function lesArgument(rest, flagg, kjende, kmdNamn) {
        var toks = tokeniser(rest), namngitt = {}, pos = [], flaggSett = {};
        for (var i = 0; i < toks.length; i++) {
            var t = toks[i];
            if (t.q === "" && /^-[A-Za-z]+$/.test(t.t)) {
                var navn = t.t.slice(1).toLowerCase();
                if (flagg.indexOf(navn) !== -1) { flaggSett[navn] = true; continue; }
                if (kjende.indexOf(navn) === -1) {
                    throw new PSFeil("A parameter cannot be found that matches parameter name '" + t.t.slice(1) + "'.",
                        "Parameteren " + t.t + " finst ikkje for " + kmdNamn + ". Gyldige parametrar: " + kjende.concat(flagg).map(function (k) { return "-" + k; }).join(", ") + ".");
                }
                if (i + 1 >= toks.length) {
                    throw new PSFeil("Missing an argument for parameter '" + t.t.slice(1) + "'.",
                        "Parameteren " + t.t + " treng ein verdi rett etter seg, til dømes " + t.t + " Prosjekt.");
                }
                namngitt[navn] = verdiAv(toks[i + 1]);
                i++;
            } else {
                pos.push(verdiAv(t));
            }
        }
        return { namngitt: namngitt, pos: pos, flagg: flaggSett };
    }

    /* ----- Uttrykk: tal, tekst, variablar og + - * / ----- */

    function evaluerUttrykk(tekst) {
        var re = /\s*(?:("[^"]*"|'[^']*')|(\d+(?:\.\d+)?)|\$(\w+)|([+\-*\/()]))/y;
        var tokens = [], pos = 0, m;
        tekst = tekst.trim();
        while (pos < tekst.length) {
            re.lastIndex = pos;
            m = re.exec(tekst);
            if (!m) { throw new PSFeil("Unexpected token '" + tekst.slice(pos).trim().split(/\s/)[0] + "' in expression or statement.", "PowerShell skjønar ikkje denne delen. Tekst må stå i hermeteikn, og variablar startar med $."); }
            if (m[1] !== undefined) { tokens.push({ k: "str", v: m[1].charAt(0) === '"' ? interpoler(m[1].slice(1, -1)) : m[1].slice(1, -1) }); }
            else if (m[2] !== undefined) { tokens.push({ k: "num", v: parseFloat(m[2]) }); }
            else if (m[3] !== undefined) {
                var n = m[3].toLowerCase();
                tokens.push({ k: "var", v: Object.prototype.hasOwnProperty.call(vars, n) ? vars[n] : "" });
            }
            else { tokens.push({ k: "op", v: m[4] }); }
            pos = re.lastIndex;
            while (pos < tekst.length && /\s/.test(tekst.charAt(pos))) { pos++; }
        }
        var i = 0;
        function feilUtt() { return new PSFeil("Unexpected end of expression.", "Uttrykket ser uferdig ut. Sjekk at kvar operator (+ - * /) har eit tal eller ein tekst på begge sider."); }
        function faktor() {
            var t = tokens[i];
            if (!t) { throw feilUtt(); }
            i++;
            if (t.k === "str" || t.k === "num" || t.k === "var") { return t.v; }
            if (t.v === "-") { var f = faktor(); return -Number(f); }
            if (t.v === "(") { var v = sum(); if (!tokens[i] || tokens[i].v !== ")") { throw new PSFeil("Missing closing ')' in expression.", "Du har gløymt ei avsluttande parentes )."); } i++; return v; }
            throw feilUtt();
        }
        function ledd() {
            var v = faktor();
            while (tokens[i] && tokens[i].k === "op" && (tokens[i].v === "*" || tokens[i].v === "/")) {
                var op = tokens[i].v; i++;
                var h = faktor();
                if (op === "*") { v = typeof v === "string" && typeof h === "number" ? new Array(h + 1).join(v) : Number(v) * Number(h); }
                else { if (Number(h) === 0) { throw new PSFeil("Attempted to divide by zero.", "Du kan ikkje dele på null. Bruk eit anna tal."); } v = Number(v) / Number(h); }
            }
            return v;
        }
        function sum() {
            var v = ledd();
            while (tokens[i] && tokens[i].k === "op" && (tokens[i].v === "+" || tokens[i].v === "-")) {
                var op = tokens[i].v; i++;
                var h = ledd();
                if (op === "+") { v = (typeof v === "number" && typeof h === "number") ? v + h : String(v) + String(h); }
                else { v = Number(v) - Number(h); }
            }
            return v;
        }
        var svar = sum();
        if (i < tokens.length) { throw new PSFeil("Unexpected token '" + tokens[i].v + "' in expression or statement.", "Det er noko ekstra i uttrykket. Sjekk at du har med alle operatorar (+ - * /)."); }
        return svar;
    }

    function tilTekst(v) { return typeof v === "number" ? String(Math.round(v * 1e6) / 1e6) : String(v); }

    /* ----- Kommandoar (cmdlets) ----- */

    var CMDS = {};     // namn (små bokstavar) -> funksjon(rest) som gir liste med tekstlinjer
    var VISNAMN = {};  // namn (små bokstavar) -> namn med rett stor bokstav
    var ALIAS = {
        "ls": "get-childitem", "dir": "get-childitem", "gci": "get-childitem",
        "cd": "set-location", "pwd": "get-location", "gl": "get-location",
        "cat": "get-content", "type": "get-content", "gc": "get-content",
        "echo": "write-output", "write": "write-output",
        "rm": "remove-item", "del": "remove-item", "ri": "remove-item",
        "cls": "clear-host", "clear": "clear-host"
    };

    function reg(namn, fn) { CMDS[namn.toLowerCase()] = fn; VISNAMN[namn.toLowerCase()] = namn; }

    function tabellRad(node, navn) {
        var mode = node.type === "dir" ? "d-----" : "-a----";
        var lengd = node.type === "file" ? String((node.content || "").length) : "";
        return mode + "        " + datoKort(node.tid) + " " + lengd.padStart(12, " ") + " " + navn;
    }

    function tabell(katalog, elementar) {
        var linjer = ["", "    Katalog: " + katalog, "",
            "Mode                 LastWriteTime         Length Name",
            "----                 -------------         ------ ----"];
        elementar.forEach(function (e) { linjer.push(tabellRad(e.node, e.navn)); });
        linjer.push("");
        return linjer;
    }

    reg("Get-Date", function (rest) {
        var a = lesArgument(rest, [], [], "Get-Date");
        var d = new Date();
        return [DAGAR[d.getDay()] + " " + d.getDate() + ". " + MANADER[d.getMonth()] + " " + d.getFullYear() + " " + to(d.getHours()) + ":" + to(d.getMinutes()) + ":" + to(d.getSeconds())];
    });

    reg("Get-Location", function () {
        return ["", "Path", "----", stiTekst(cwd), ""];
    });

    reg("Get-ChildItem", function (rest) {
        var a = lesArgument(rest, [], ["path"], "Get-ChildItem");
        var sti = a.namngitt.path || a.pos[0] || ".";
        var delar = losSti(sti);
        var r = gaaGjennom(delar);
        if (!r) { throw ikkjeFunnet(stiTekst(delar)); }
        if (r.node.type === "file") { return tabell(stiTekst(r.delar.slice(0, -1)), [{ node: r.node, navn: r.delar[r.delar.length - 1] }]); }
        var namn = Object.keys(r.node.children).sort(function (x, y) {
            var dx = r.node.children[x].type === "dir" ? 0 : 1, dy = r.node.children[y].type === "dir" ? 0 : 1;
            return dx - dy || x.toLowerCase().localeCompare(y.toLowerCase());
        });
        if (namn.length === 0) { return []; }
        return tabell(stiTekst(r.delar), namn.map(function (n) { return { node: r.node.children[n], navn: n }; }));
    });

    reg("Set-Location", function (rest) {
        var a = lesArgument(rest, [], ["path"], "Set-Location");
        var sti = a.namngitt.path || a.pos[0];
        if (!sti) { throw new PSFeil("Set-Location: Missing path argument.", "Du må seie kvar du vil gå. Prøv: Set-Location Dokument, eller Set-Location .. for å gå eitt steg opp."); }
        var delar = losSti(sti);
        var r = gaaGjennom(delar);
        if (!r) { throw ikkjeFunnet(stiTekst(delar)); }
        if (r.node.type !== "dir") { throw new PSFeil("Set-Location: '" + stiTekst(r.delar) + "' is not a directory.", "Du kan berre gå inn i mapper, ikkje filer. Bruk Get-Content for å lese ei fil."); }
        cwd = r.delar;
        return [];
    });

    reg("New-Item", function (rest) {
        var a = lesArgument(rest, [], ["path", "name", "itemtype", "value"], "New-Item");
        var path = a.namngitt.path || a.pos[0];
        var navn = a.namngitt.name;
        var type = a.namngitt.itemtype;
        if (!type) { throw new PSFeil("New-Item: Missing -ItemType parameter.", "PowerShell må vite kva du vil lage. Legg til -ItemType Directory for ei mappe eller -ItemType File for ei fil."); }
        var tl = type.toLowerCase();
        if (tl !== "directory" && tl !== "file") { throw new PSFeil("New-Item: Cannot create an item of type '" + type + "'.", "Typen må vere Directory (mappe) eller File (fil)."); }
        if (!path && !navn) { throw new PSFeil("New-Item: Missing -Name or -Path.", "Seie kva den nye tingen skal heite, til dømes -Name Prosjekt."); }
        var delar;
        if (navn) { delar = losSti(path || ".").concat([navn]); }
        else { delar = losSti(path); }
        var forelder = gaaGjennom(delar.slice(0, -1));
        if (!forelder || forelder.node.type !== "dir") { throw ikkjeFunnet(stiTekst(delar.slice(0, -1))); }
        var nytt = delar[delar.length - 1];
        if (/[<>:"|?*\\\/]/.test(nytt)) { throw new PSFeil("New-Item: The filename contains illegal characters.", "Namnet kan ikkje ha teikn som < > : \" | ? *."); }
        if (finnNokkel(forelder.node, nytt)) { throw new PSFeil("New-Item: An item with the specified name '" + stiTekst(forelder.delar.concat([nytt])) + "' already exists.", "Det finst allereie noko med dette namnet her. Vel eit anna namn, eller slett det gamle med Remove-Item."); }
        var no = new Date();
        var node = tl === "directory" ? { type: "dir", children: {}, tid: no } : { type: "file", content: a.namngitt.value || "", tid: no };
        forelder.node.children[nytt] = node;
        return tabell(stiTekst(forelder.delar), [{ node: node, navn: nytt }]);
    });

    reg("Get-Content", function (rest) {
        var a = lesArgument(rest, [], ["path"], "Get-Content");
        var sti = a.namngitt.path || a.pos[0];
        if (!sti) { throw new PSFeil("Get-Content: Missing path argument.", "Seie kva fil du vil lese, til dømes Get-Content notat.txt."); }
        var delar = losSti(sti), r = gaaGjennom(delar);
        if (!r) { throw ikkjeFunnet(stiTekst(delar)); }
        if (r.node.type === "dir") { throw new PSFeil("Get-Content: Access to the path '" + stiTekst(r.delar) + "' is denied.", "Dette er ei mappe, ikkje ei fil. Bruk Get-ChildItem for å sjå kva som ligg i mappa."); }
        return r.node.content === "" ? [] : r.node.content.split("\n");
    });

    function skrivInnhald(rest, kmdNamn, leggTil) {
        var a = lesArgument(rest, [], ["path", "value"], kmdNamn);
        var sti = a.namngitt.path || a.pos[0];
        var verdi = a.namngitt.value !== undefined ? a.namngitt.value : a.pos[1];
        if (!sti) { throw new PSFeil(kmdNamn + ": Missing path argument.", "Seie kva fil du vil skrive til, til dømes " + kmdNamn + " notat.txt -Value \"Hei\"."); }
        if (verdi === undefined) { throw new PSFeil(kmdNamn + ": Missing -Value parameter.", "Seie kva du vil skrive, til dømes -Value \"Hei\"."); }
        var delar = losSti(sti), r = gaaGjennom(delar);
        if (r && r.node.type === "dir") { throw new PSFeil(kmdNamn + ": '" + stiTekst(r.delar) + "' is a directory.", "Du kan ikkje skrive til ei mappe. Vel eit filnamn."); }
        if (r) {
            r.node.content = leggTil && r.node.content ? r.node.content + "\n" + verdi : verdi;
            r.node.tid = new Date();
        } else {
            var forelder = gaaGjennom(delar.slice(0, -1));
            if (!forelder || forelder.node.type !== "dir") { throw ikkjeFunnet(stiTekst(delar.slice(0, -1))); }
            forelder.node.children[delar[delar.length - 1]] = { type: "file", content: verdi, tid: new Date() };
        }
        return [];
    }
    reg("Set-Content", function (rest) { return skrivInnhald(rest, "Set-Content", false); });
    reg("Add-Content", function (rest) { return skrivInnhald(rest, "Add-Content", true); });

    reg("Remove-Item", function (rest) {
        var a = lesArgument(rest, ["recurse", "force"], ["path"], "Remove-Item");
        var sti = a.namngitt.path || a.pos[0];
        if (!sti) { throw new PSFeil("Remove-Item: Missing path argument.", "Seie kva du vil slette, til dømes Remove-Item hei.txt."); }
        var delar = losSti(sti), r = gaaGjennom(delar);
        if (!r) { throw ikkjeFunnet(stiTekst(delar)); }
        if (delar.length <= 3) {
            throw new PSFeil("Remove-Item: Cannot remove '" + stiTekst(r.delar) + "'.", "Denne mappa er viktig og kan ikkje slettast i simuleringa. Prøv med ei fil eller mappe du har laga sjølv.");
        }
        if (cwd.join("\\").toLowerCase().indexOf(r.delar.join("\\").toLowerCase()) === 0) {
            throw new PSFeil("Remove-Item: Cannot remove the current location.", "Du står i denne mappa no. Gå ut av ho først, til dømes med Set-Location ..");
        }
        if (r.node.type === "dir" && Object.keys(r.node.children).length > 0 && !a.flagg.recurse) {
            throw new PSFeil("Remove-Item: The item at '" + stiTekst(r.delar) + "' has children and the Recurse parameter was not specified.", "Mappa har innhald. Legg til -Recurse om du verkeleg vil slette alt inni.");
        }
        var forelder = gaaGjennom(r.delar.slice(0, -1));
        delete forelder.node.children[r.delar[r.delar.length - 1]];
        return [];
    });

    reg("Test-Path", function (rest) {
        var a = lesArgument(rest, [], ["path"], "Test-Path");
        var sti = a.namngitt.path || a.pos[0];
        if (!sti) { throw new PSFeil("Test-Path: Missing path argument.", "Seie kva sti du vil sjekke, til dømes Test-Path notat.txt."); }
        return [gaaGjennom(losSti(sti)) ? "True" : "False"];
    });

    function skrivUt(rest) {
        if (rest === "") { return [""]; }
        try { return [tilTekst(evaluerUttrykk(rest))]; }
        catch (e) { if (e instanceof PSFeil) { return [rest]; } throw e; } // ord utan hermeteikn blir skrivne som dei er
    }
    reg("Write-Host", skrivUt);
    reg("Write-Output", skrivUt);

    reg("Get-Process", function () {
        return ["", "Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName", "-------  ------    -----      -----     ------     --  -- -----------",
            "    312      18    24560      41200       2,41   1204   1 chrome", "    198      12    18340      30112       1,07   2210   1 Code",
            "    145       9     5120      12880       0,31   4120   1 explorer", "    522      28    78420     120300      12,66   6480   1 powershell", ""];
    });

    reg("Get-Service", function () {
        return ["", "Status   Name               DisplayName", "------   ----               -----------",
            "Running  Dhcp               DHCP Client", "Running  Dnscache           DNS Client", "Running  EventLog           Windows Event Log",
            "Stopped  Spooler            Print Spooler", "Running  Winmgmt            Windows Management Instrumentation", ""];
    });

    var HJELP = {
        "get-date": "Get-Date: Viser dagens dato og klokkeslett.",
        "get-location": "Get-Location: Viser kva mappe du står i.",
        "get-childitem": "Get-ChildItem [-Path] <sti>: Viser filer og mapper.",
        "set-location": "Set-Location <sti>: Går til ei anna mappe. Bruk .. for å gå eitt steg opp.",
        "new-item": "New-Item -Name <namn> -ItemType Directory|File [-Value <tekst>]: Lagar ei ny mappe eller fil.",
        "get-content": "Get-Content <fil>: Viser innhaldet i ei fil.",
        "set-content": "Set-Content <fil> -Value <tekst>: Skriv tekst til ei fil (erstattar det som stod der).",
        "add-content": "Add-Content <fil> -Value <tekst>: Legg tekst til slutt i ei fil.",
        "remove-item": "Remove-Item <sti> [-Recurse]: Slettar ei fil eller mappe.",
        "test-path": "Test-Path <sti>: Seier True om stien finst, elles False.",
        "write-host": "Write-Host <tekst>: Skriv ut tekst på skjermen.",
        "write-output": "Write-Output <tekst>: Sender tekst ut frå kommandoen.",
        "clear-host": "Clear-Host: Tømmer skjermen.",
        "get-process": "Get-Process: Viser program som køyrer.",
        "get-service": "Get-Service: Viser Windows-tenester.",
        "get-command": "Get-Command: Viser ei liste med kommandoar.",
        "get-help": "Get-Help <kommando>: Gir hjelp om ei kommando."
    };

    reg("Get-Help", function (rest) {
        var navn = rest.trim().toLowerCase();
        if (!navn) {
            return ["", "OMSKRIVING", "    Get-Help viser hjelp om kommandoar.", "", "PRØV", "    Get-Help Get-Date", "    Get-Command   (viser alle kommandoar du kan bruke her)", ""];
        }
        if (ALIAS[navn]) { navn = ALIAS[navn]; }
        if (!HJELP[navn]) { throw new PSFeil("Get-Help: Get-Help could not find " + rest.trim() + " in a help file.", "Eg finn ikkje hjelp om «" + rest.trim() + "». Skriv Get-Command for å sjå kva kommandoar du kan bruke."); }
        return ["", HJELP[navn], ""];
    });

    reg("Get-Command", function () {
        var namn = Object.keys(VISNAMN).map(function (k) { return VISNAMN[k]; }).sort();
        return ["", "CommandType     Name"].concat(["-----------     ----"]).concat(namn.map(function (n) { return "Cmdlet          " + n; })).concat([""]);
    });

    reg("Clear-Host", function () { return null; }); // null betyr: tøm skjermen

    /* ----- Finn næraste kommandonamn (for «Meinte du …?») ----- */
    function avstand(a, b) {
        var d = [], i, j;
        for (i = 0; i <= a.length; i++) { d[i] = [i]; }
        for (j = 1; j <= b.length; j++) { d[0][j] = j; }
        for (i = 1; i <= a.length; i++) {
            for (j = 1; j <= b.length; j++) {
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
            }
        }
        return d[a.length][b.length];
    }
    function naermaste(navn) {
        var best = null, bestD = 99;
        Object.keys(VISNAMN).forEach(function (k) {
            var d = avstand(navn.toLowerCase(), k);
            if (d < bestD) { bestD = d; best = VISNAMN[k]; }
        });
        return bestD <= 4 ? best : null;
    }

    /* ----- Køyr ei linje ----- */

    /**
     * Køyrer ei linje og gir tilbake liste med utlinjer: { t: tekst, c: klasse }.
     * Kastar aldri feil: feil blir gjort om til raude linjer med eit gult hint.
     */
    function kjorLinje(linje, djupn) {
        var ut = [];
        function leggTil(tekster, klasse) { (tekster || []).forEach(function (t) { ut.push({ t: t, c: klasse || "" }); }); }
        var tekst = linje.trim();
        if (!tekst) { return { ut: ut, ok: true, tom: true }; }
        try {
            /* foreach-løkke på ei linje: foreach ($i in 1..3) { Write-Host "Runde $i" } */
            var fm = /^foreach\s*\(\s*\$(\w+)\s+in\s+(\d+)\s*\.\.\s*(\d+)\s*\)\s*\{\s*(.+?)\s*\}\s*$/i.exec(tekst);
            if (fm) {
                if ((djupn || 0) > 0) { throw new PSFeil("Nested loops are not supported here.", "Denne terminalen støttar ikkje løkke inni løkke."); }
                var frå = parseInt(fm[2], 10), til = parseInt(fm[3], 10);
                if (Math.abs(til - frå) > 50) { throw new PSFeil("The range is too large for this simulator.", "Bruk eit mindre område, til dømes 1..5."); }
                var steg = frå <= til ? 1 : -1;
                for (var n = frå; steg > 0 ? n <= til : n >= til; n += steg) {
                    vars[fm[1].toLowerCase()] = n;
                    var inn = kjorLinje(fm[4], 1);
                    if (inn.feil) { return inn; }
                    ut = ut.concat(inn.ut);
                }
                return { ut: ut, ok: true, kmd: "foreach" };
            }

            /* Tilordning: $namn = "Frode" */
            var tm = /^\$(\w+)\s*=\s*(.+)$/.exec(tekst);
            if (tm) {
                var rhs = tm[2].trim();
                var forsteOrd = rhs.split(/\s+/)[0].toLowerCase();
                var verdi;
                if (CMDS[forsteOrd] || ALIAS[forsteOrd]) {
                    var res = kjorLinje(rhs, 1);
                    if (res.feil) { return res; }
                    verdi = res.ut.map(function (x) { return x.t; }).join("\n");
                } else {
                    verdi = evaluerUttrykk(rhs);
                }
                vars[tm[1].toLowerCase()] = verdi;
                return { ut: ut, ok: true, kmd: "tilordning" };
            }
            if (/^\$\w+\s*=\s*$/.test(tekst)) { throw new PSFeil("Missing expression after '='.", "Du må skrive ein verdi etter likskapsteiknet, til dømes $namn = \"Ola\"."); }

            /* Uttrykk: $namn, "tekst", 2 + 3 */
            if (/^[\$"'\d(\-]/.test(tekst)) {
                var v = evaluerUttrykk(tekst);
                if (/\$namn\b/i.test(tekst) && Object.prototype.hasOwnProperty.call(vars, "namn")) { term.namnUtskrift = true; }
                leggTil([tilTekst(v)]);
                return { ut: ut, ok: true, kmd: "uttrykk" };
            }

            /* Vanleg kommando */
            var delar = /^(\S+)\s*(.*)$/.exec(tekst);
            var namn = delar[1].toLowerCase(), rest = delar[2];
            var brukaAlias = false;
            if (ALIAS[namn]) { brukaAlias = true; var fullt = ALIAS[namn]; if (namn === "cd" && rest === "") { rest = ""; } namn = fullt; }
            if (namn === "mkdir" || namn === "md") { brukaAlias = false; throw new PSFeil("mkdir is not available in this simulator.", "Bruk det fulle namnet: New-Item -Name Prosjekt -ItemType Directory"); }
            if (namn === "exit") { throw new PSFeil("exit is not used in this simulator.", "Dette er ein simulert terminal. Du treng ikkje avslutte. Byt side i menyen når du er ferdig."); }
            if (!CMDS[namn]) {
                var forslag = naermaste(delar[1]);
                var feilmsg = delar[1] + " : The term '" + delar[1] + "' is not recognized as the name of a cmdlet, function, script file, or operable program.";
                var hint = "PowerShell kjenner ikkje «" + delar[1] + "». " + (forslag ? "Meinte du «" + forslag + "»? " : "") + "Kommandoar har forma Verb-Substantiv, som Get-Date. Skriv Get-Command for å sjå ei liste.";
                throw new PSFeil(feilmsg, hint);
            }
            var svar = CMDS[namn](rest);
            if (svar === null) { return { ut: ut, ok: true, tom: false, tøm: true, kmd: namn }; }
            leggTil(svar);
            if ((namn === "write-host" || namn === "write-output") && /\$namn\b/i.test(rest) && Object.prototype.hasOwnProperty.call(vars, "namn")) { term.namnUtskrift = true; }
            if (brukaAlias) { leggTil(["Tips: «" + delar[1] + "» er ein kortversjon (alias). Det fulle namnet er " + VISNAMN[namn] + ". Bruk det fulle namnet, så blir koden lettare å lese."], "info"); }
            return { ut: ut, ok: true, kmd: namn };
        } catch (e) {
            if (!(e instanceof PSFeil)) { throw e; }
            return { ut: [{ t: e.msg, c: "fel" }, { t: "Hint: " + e.hint, c: "hint" }], ok: false, feil: true, kmd: "" };
        }
    }

    /* ----- Terminalvisinga ----- */

    function promptTekst() { return "PS " + stiTekst(cwd) + ">"; }

    function oppdaterPrompt() { $("termPrompt").textContent = promptTekst(); }

    function skrivLinje(tekst, klasse) {
        var l = el("div", "l" + (klasse ? " " + klasse : ""), tekst === "" ? "\u00a0" : tekst);
        $("termUt").appendChild(l);
    }

    function skrivEcho(prompt, kommando) {
        var l = el("div", "l echo");
        var p = el("span", "p", prompt + " ");
        l.appendChild(p);
        l.appendChild(document.createTextNode(kommando));
        $("termUt").appendChild(l);
    }

    function rullNed() { var t = $("term"); t.scrollTop = t.scrollHeight; }

    function velkomst() {
        $("termUt").textContent = "";
        skrivLinje("Windows PowerShell (simulert)", "info");
        skrivLinje("Dette er ein øvingsterminal. Ingenting her påverkar den ekte datamaskina di.", "info");
        skrivLinje("Skriv Get-Command for å sjå kva du kan bruke, eller løys oppgåvene.", "info");
        skrivLinje("");
    }

    function nullstillTerminal() {
        nullstillTerminalTilstand();
        historikk = []; histPos = 0;
        velkomst();
        oppdaterPrompt();
        $("termInn").value = "";
    }

    function sendKommando(linje) {
        var promptFør = promptTekst();
        skrivEcho(promptFør, linje);
        if (linje.trim()) {
            historikk.push(linje);
            histPos = historikk.length;
        }
        var res = kjorLinje(linje, 0);
        if (res.tøm) { $("termUt").textContent = ""; }
        res.ut.forEach(function (x) { skrivLinje(x.t, x.c); });
        term.sisteKmd = res.kmd || "";
        term.sisteOk = !!res.ok && !res.tom;
        oppdaterPrompt();
        sjekkOppgaver();
        rullNed();
    }

    function startTerminal() {
        nullstillTerminal();
        $("termSkjema").addEventListener("submit", function (e) {
            e.preventDefault();
            var inn = $("termInn");
            var v = inn.value;
            inn.value = "";
            sendKommando(v);
        });
        $("termInn").addEventListener("keydown", function (e) {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (histPos > 0) { histPos--; $("termInn").value = historikk[histPos]; }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (histPos < historikk.length - 1) { histPos++; $("termInn").value = historikk[histPos]; }
                else { histPos = historikk.length; $("termInn").value = ""; }
            } else if (e.key === "Tab") {
                /* Tab fullfører kommandonamn, til dømes Get-Ch -> Get-ChildItem */
                var inn = $("termInn"), v = inn.value;
                var m = /^(\S+)$/.exec(v);
                if (!m) { return; }
                e.preventDefault();
                var treff = Object.keys(VISNAMN).filter(function (k) { return k.indexOf(m[1].toLowerCase()) === 0; })
                    .map(function (k) { return VISNAMN[k]; }).sort();
                if (treff.length === 1) { inn.value = treff[0] + " "; }
                else if (treff.length > 1) {
                    skrivEcho(promptTekst(), v);
                    skrivLinje(treff.join("   "), "info");
                    rullNed();
                }
            }
        });
        $("term").addEventListener("click", function () {
            if (!window.getSelection || String(window.getSelection()) === "") { $("termInn").focus(); }
        });
        $$(".chip").forEach(function (c) {
            c.addEventListener("click", function () {
                $("termInn").value = c.getAttribute("data-kmd");
                $("termInn").focus();
            });
        });
        $("termNull").addEventListener("click", function () {
            nullstillTerminal();
            $("termInn").focus();
            toast("Terminalen er nullstilt", "i-oppatt");
        });
    }

    /* =====================================================
       7. Oppgåvene
       ===================================================== */
    var hintNivaa = {};   // 0 = ingenting, 1 = hint vist, 2 = løysing vist
    var fyllPos = {};     // kva linje i løysinga som blir fylt inn neste gong
    var nyssLoyst = {};

    function byggOppgaver() {
        var liste = $("oppgListe");
        liste.textContent = "";
        var forsteIkkjeFerdig = -1;
        OPPG.forEach(function (o, i) { if (forsteIkkjeFerdig === -1 && state.oppg.indexOf(o.id) === -1) { forsteIkkjeFerdig = i; } });
        $("oppgStatus").textContent = state.oppg.length + " av " + OPPG.length + " løyste";

        OPPG.forEach(function (o, i) {
            var ferdig = state.oppg.indexOf(o.id) !== -1;
            var li = el("li", "oppg" + (ferdig ? " ferdig" : "") + (i === forsteIkkjeFerdig ? " aktiv" : "") + (nyssLoyst[o.id] ? " nyss" : ""));
            var topp = el("div", "oppg-topp");
            var ik = el("span", "oppg-ikon");
            if (ferdig) { ik.appendChild(ikon("i-hake")); } else { ik.textContent = String(i + 1); }
            topp.appendChild(ik);
            var tekstBoks = el("div");
            tekstBoks.appendChild(el("div", "oppg-tekst", o.tekst));
            tekstBoks.appendChild(el("div", "oppg-poeng", ferdig ? "Løyst! +20 poeng" : "20 poeng"));
            topp.appendChild(tekstBoks);
            li.appendChild(topp);

            if (!ferdig) {
                var nivaa = hintNivaa[o.id] || 0;
                var rad = el("div", "oppg-knappar");
                if (nivaa === 0) {
                    var hb = knapp("hint-knapp", "i-lyspære", "Hint");
                    hb.addEventListener("click", function () { hintNivaa[o.id] = 1; byggOppgaver(); });
                    rad.appendChild(hb);
                } else if (nivaa === 1) {
                    var lb = knapp("hint-knapp", "i-lyspære", "Vis løysing");
                    lb.addEventListener("click", function () { hintNivaa[o.id] = 2; byggOppgaver(); });
                    rad.appendChild(lb);
                } else {
                    var pos = fyllPos[o.id] || 0;
                    var fb = knapp("hint-knapp", "i-kopi", o.losning.length > 1 ? "Fyll inn linje " + (pos + 1) : "Fyll inn");
                    fb.addEventListener("click", function () {
                        var p = fyllPos[o.id] || 0;
                        $("termInn").value = o.losning[p];
                        $("termInn").focus();
                        fyllPos[o.id] = (p + 1) % o.losning.length;
                        byggOppgaver();
                    });
                    rad.appendChild(fb);
                }
                li.appendChild(rad);
                if (nivaa >= 1) { li.appendChild(el("div", "hint-tekst", "Hint: " + o.hint)); }
                if (nivaa >= 2) {
                    var ht = el("div", "hint-tekst");
                    ht.appendChild(el("span", "", "Løysing: "));
                    o.losning.forEach(function (l, li2) {
                        if (li2) { ht.appendChild(el("span", "", " så ")); }
                        ht.appendChild(el("code", "", l));
                    });
                    li.appendChild(ht);
                }
            }
            liste.appendChild(li);
        });
        nyssLoyst = {};
    }

    /** Køyrer etter kvar kommando: sjekkar om ei oppgåve er løyst. */
    function sjekkOppgaver() {
        var tilstand = { cwd: cwd, sisteKmd: term.sisteKmd, sisteOk: term.sisteOk, namnUtskrift: term.namnUtskrift };
        var nye = [];
        OPPG.forEach(function (o) {
            if (state.oppg.indexOf(o.id) === -1 && o.sjekk(tilstand)) { state.oppg.push(o.id); nye.push(o); nyssLoyst[o.id] = true; }
        });
        if (nye.length) {
            lagre();
            byggOppgaver();
            oppdaterTopp();
            nye.forEach(function (o) { skrivLinje("✔ Oppgåve løyst: " + o.tekst + " (+20 poeng)", "ok"); });
            toast("+" + (nye.length * 20) + " poeng! Oppgåve løyst", "i-mal");
            if (state.oppg.length === OPPG.length) {
                skrivLinje("★ Du har løyst alle oppgåvene. Flott jobba! Prøv quizen no.", "ok");
                konfetti(80);
            }
        }
    }

    /* =====================================================
       8. Quizen
       ===================================================== */
    var BOKSTAVAR = ["A", "B", "C", "D"];
    var qz = { rekkefolge: [], altOrd: [], nr: 0, rette: 0, valt: null, svart: false, rekke: 0, besteRekke: 0 };

    function startQuiz() {
        qz.rekkefolge = stokk(SPM.map(function (_, i) { return i; }));
        qz.nr = 0; qz.rette = 0; qz.rekke = 0; qz.besteRekke = 0;
        nyttSpm();
    }

    function nyttSpm() {
        var s = SPM[qz.rekkefolge[qz.nr]];
        qz.altOrd = stokk(s.a.map(function (_, i) { return i; }));
        qz.valt = null;
        qz.svart = false;
        visSpm();
    }

    function visSpm(fokusAlt) {
        var idx = qz.rekkefolge[qz.nr];
        var s = SPM[idx];
        var kort = $("quizKort");
        kort.textContent = "";

        /* Topp: nummer, rekkje og rette */
        var topp = el("div", "quiz-topp");
        topp.appendChild(el("span", "", "Spørsmål " + (qz.nr + 1) + " av " + SPM.length));
        var merke = el("div", "knapperad");
        merke.style.gap = "8px";
        if (qz.rekke >= 2) {
            var fl = el("span", "quiz-merke flamme");
            fl.appendChild(ikon("i-flamme"));
            fl.appendChild(el("span", "", qz.rekke + " på rad"));
            merke.appendChild(fl);
        }
        var rm = el("span", "quiz-merke");
        rm.appendChild(ikon("i-hake"));
        rm.appendChild(el("span", "", qz.rette + " rette"));
        merke.appendChild(rm);
        topp.appendChild(merke);
        kort.appendChild(topp);

        var fr = el("div", "framdrift");
        var f = el("div");
        f.style.width = ((qz.nr + (qz.svart ? 1 : 0)) / SPM.length * 100) + "%";
        fr.appendChild(f);
        kort.appendChild(fr);

        var spm = el("div", "quiz-spm", s.q);
        spm.id = "quizSpm";
        kort.appendChild(spm);

        /* Svaralternativ: vel og byt fritt til du trykker «Sjekk svar» */
        var alt = el("div", "svaralt");
        alt.setAttribute("role", "radiogroup");
        alt.setAttribute("aria-labelledby", "quizSpm");
        qz.altOrd.forEach(function (ai, pos) {
            var b = el("button");
            b.type = "button";
            b.setAttribute("role", "radio");
            b.setAttribute("aria-checked", qz.valt === ai ? "true" : "false");
            b.tabIndex = (qz.valt === ai || (qz.valt === null && pos === 0)) ? 0 : -1;
            b.appendChild(el("span", "bokstav", BOKSTAVAR[pos]));
            b.appendChild(el("span", "", s.a[ai]));
            if (qz.svart) {
                b.disabled = true;
                if (ai === s.r) { b.classList.add("rett"); var m1 = el("span", "merknad"); m1.appendChild(ikon("i-hake")); b.appendChild(m1); }
                else if (ai === qz.valt) { b.classList.add("feil"); var m2 = el("span", "merknad"); m2.appendChild(ikon("i-kryss")); b.appendChild(m2); }
            }
            b.addEventListener("click", function () {
                if (qz.svart) { return; }
                qz.valt = ai;
                visSpm(ai);
            });
            b.addEventListener("keydown", function (e) {
                if (qz.svart) { return; }
                var n = null;
                if (e.key === "ArrowDown" || e.key === "ArrowRight") { n = (pos + 1) % qz.altOrd.length; }
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") { n = (pos - 1 + qz.altOrd.length) % qz.altOrd.length; }
                if (n !== null) { e.preventDefault(); qz.valt = qz.altOrd[n]; visSpm(qz.valt); }
            });
            b.setAttribute("data-ai", String(ai));
            alt.appendChild(b);
        });
        kort.appendChild(alt);

        /* Tilbakemelding */
        var fb = el("div", "quiz-fb");
        fb.setAttribute("aria-live", "polite");
        if (!qz.svart) {
            fb.textContent = qz.valt === null ? "Vel eit svar." : "Du kan framleis byte svar. Trykk «Sjekk svar» når du er sikker.";
        } else {
            var rett = qz.valt === s.r;
            fb.className = "quiz-fb " + (rett ? "ok" : "nei");
            var sterk = el("strong", "", rett ? "Rett! " : "Feil. ");
            fb.appendChild(sterk);
            fb.appendChild(document.createTextNode((rett && qz.nyttPoeng ? "+10 poeng. " : "") + s.f));
        }
        kort.appendChild(fb);

        /* Knappar */
        var rad = el("div", "knapperad");
        if (!qz.svart) {
            var sjekk = knapp("knapp", "i-hake", "Sjekk svar");
            sjekk.disabled = qz.valt === null;
            sjekk.addEventListener("click", function () {
                if (qz.valt === null) { return; }
                qz.svart = true;
                qz.nyttPoeng = false;
                if (qz.valt === s.r) {
                    qz.rette++;
                    qz.rekke++;
                    qz.besteRekke = Math.max(qz.besteRekke, qz.rekke);
                    if (state.quiz.indexOf(idx) === -1) {
                        state.quiz.push(idx); lagre(); oppdaterTopp(); qz.nyttPoeng = true;
                        toast("+10 poeng!");
                    }
                } else {
                    qz.rekke = 0;
                }
                visSpm();
                var n = $("quizNeste");
                if (n) { n.focus(); }
            });
            rad.appendChild(sjekk);
        } else {
            var siste = qz.nr === SPM.length - 1;
            var neste = knapp("knapp", siste ? "i-pokal" : "i-pil-h", siste ? "Sjå resultatet" : "Neste spørsmål");
            neste.id = "quizNeste";
            neste.addEventListener("click", function () {
                if (!siste) {
                    qz.nr++;
                    nyttSpm();
                    var forste = document.querySelector(".svaralt button");
                    if (forste) { forste.focus(); }
                } else { sluttQuiz(); }
            });
            rad.appendChild(neste);
        }
        kort.appendChild(rad);

        if (fokusAlt !== undefined) {
            var valt = kort.querySelector('.svaralt button[data-ai="' + fokusAlt + '"]');
            if (valt) { valt.focus(); }
        }
    }

    function sluttQuiz() {
        var n = SPM.length;
        var andel = qz.rette / n;
        var melding;
        if (qz.rette === n) { melding = "Perfekt! Du kan PowerShell!"; }
        else if (andel >= 0.8) { melding = "Veldig bra! Du kan mykje om PowerShell."; }
        else if (andel >= 0.5) { melding = "Bra jobba! Les nivåa ein gong til, så får du enda fleire rette."; }
        else { melding = "Godt forsøk! Øv litt i terminalen og prøv igjen."; }

        var kort = $("quizKort");
        kort.textContent = "";
        var s = el("div", "quiz-slutt");
        s.appendChild(el("h3", "", "Ferdig!"));

        /* Ring som viser kor mange som var rette */
        var omkrins = 2 * Math.PI * 70;
        var ring = el("div", "ring");
        ring.innerHTML =
            '<svg viewBox="0 0 170 170" aria-hidden="true">' +
            '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset=".5" stop-color="#0fb5ae"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>' +
            '<circle class="bak" cx="85" cy="85" r="70"/>' +
            '<circle class="fram" cx="85" cy="85" r="70" stroke-dasharray="' + omkrins + '" stroke-dashoffset="' + omkrins + '"/></svg>';
        ring.appendChild(el("div", "tal", qz.rette + "/" + n));
        ring.setAttribute("role", "img");
        ring.setAttribute("aria-label", qz.rette + " av " + n + " rette");
        s.appendChild(ring);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                ring.querySelector(".fram").setAttribute("stroke-dashoffset", String(omkrins * (1 - andel)));
            });
        });

        s.appendChild(el("p", "stor", melding));
        s.appendChild(el("p", "muted", "Lengste rekkje med rette: " + qz.besteRekke + ". Du har no " + poeng() + " poeng totalt, og " + state.quiz.length + " av " + n + " quizspørsmål er fullførte."));

        var rad = el("div", "knapperad");
        var igjen = knapp("knapp", "i-oppatt", "Prøv igjen");
        igjen.addEventListener("click", startQuiz);
        var tilT = knapp("knapp sek", "i-terminal", "Øv i terminalen");
        tilT.addEventListener("click", function () { gaaTil("terminal"); });
        rad.appendChild(igjen);
        rad.appendChild(tilT);
        s.appendChild(rad);
        kort.appendChild(s);
        if (andel >= 0.8) { konfetti(90); }
    }

    /* =====================================================
       9. Oppstart
       ===================================================== */
    function start() {
        lastFramgang();
        settTema(state.tema);

        $("temaKnapp").addEventListener("click", function () { settTema(state.tema === "dark" ? "light" : "dark"); });

        $$(".meny button").forEach(function (b) {
            b.addEventListener("click", function () { gaaTil(b.getAttribute("data-visning")); });
        });
        $$("[data-gaa]").forEach(function (b) {
            b.addEventListener("click", function (e) { e.preventDefault(); gaaTil(b.getAttribute("data-gaa")); });
        });
        $("fortsetKnapp").addEventListener("click", fortset);

        $("nullAlt").addEventListener("click", function () {
            if (window.confirm("Vil du nullstille alle poeng og all framgang?")) {
                state.nivaa = []; state.oppg = []; state.quiz = []; state.sist = 0;
                hintNivaa = {}; fyllPos = {}; sjekkRett = {};
                lagre();
                visNivaa(0); byggOppgaver(); oppdaterTopp(); startQuiz();
                toast("Framgangen er nullstilt", "i-oppatt");
            }
        });

        visNivaa(state.sist);
        byggOppgaver();
        startTerminal();
        startQuiz();
        oppdaterTopp();
        startHeroDemo();

        var h = (location.hash || "").replace("#", "");
        gaaTil(VISNINGAR.indexOf(h) !== -1 ? h : "heim", false);
        window.scrollTo(0, 0);
    }

    start();
})();
