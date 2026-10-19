/* =========================================================
   Gruppe 6 – Lær PowerShell  |  script.js
   Innhald:
     1. Hjelpefunksjonar
     2. Data: nivå, oppgåver og quiz-spørsmål
     3. Framgang og poeng (lagra i localStorage)
     4. Navigasjon og lys/mørk modus
     5. Nivåvisinga («Lær PowerShell»)
     6. Den simulerte terminalen (filsystem, kommandoar, uttrykk)
     7. Oppgåvene
     8. Quizen
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

    /** Lagar eit HTML-element med klasse og tekst (textContent er trygt mot XSS). */
    function el(tag, klasse, tekst) {
        var e = document.createElement(tag);
        if (klasse) { e.className = klasse; }
        if (tekst !== undefined) { e.textContent = tekst; }
        return e;
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

    /** Liten melding nede på skjermen, til dømes «+10 poeng». */
    var toastTimer = null;
    function toast(tekst) {
        var t = $("toast");
        t.textContent = tekst;
        t.classList.add("vis");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove("vis"); }, 2200);
    }

    /* =====================================================
       2. Data
       ===================================================== */

    /* Kvart nivå har tittel, tekst og eksempel (kode + forklaring + kommando til terminalen) */
    var NIVAA = [
        {
            tittel: "Kva er PowerShell?",
            tekst: "PowerShell er eit program frå Microsoft der du styrer datamaskina med tekst. Du skriv ei kommando, trykker Enter, og får svar. Kommandoane i PowerShell heiter <strong>cmdlets</strong> (les: «kommandolett»). Dei har alltid forma <strong>Verb-Substantiv</strong>, som <span class='kodeinline'>Get-Date</span>: «Get» betyr «hent», og «Date» betyr «dato».",
            eks: [
                { kode: "Get-Date", forklaring: "Hentar dagens dato og klokkeslett. Dette er den enklaste kommandoen å starte med.", prov: "Get-Date" }
            ]
        },
        {
            tittel: "Grunnleggjande kommandoar",
            tekst: "Her er fire kommandoar du får bruk for heile tida. Merk at vi skriv det <strong>fulle namnet</strong> på kommandoane. Det gjer koden lettare å lese.",
            eks: [
                { kode: "Get-Location", forklaring: "Viser kva mappe du står i akkurat no.", prov: "Get-Location" },
                { kode: "Get-Command", forklaring: "Viser ei liste over kommandoar du kan bruke.", prov: "Get-Command" },
                { kode: "Get-Help Get-Date", forklaring: "Gir hjelp om ei kommando. Her får du hjelp om Get-Date.", prov: "Get-Help Get-Date" },
                { kode: "Write-Host \"Hei, verda!\"", forklaring: "Skriv ut tekst på skjermen. Teksten står mellom hermeteikn.", prov: "Write-Host \"Hei, verda!\"" }
            ]
        },
        {
            tittel: "Navigering mellom mapper",
            tekst: "Mapper er som rom i eit hus. Med PowerShell kan du sjå kva som er i rommet og gå inn i andre rom. Prøv i terminalen: du startar i mappa <span class='kodeinline'>C:\\Brukarar\\Elev</span>.",
            eks: [
                { kode: "Get-ChildItem", forklaring: "Viser alle filer og mapper i mappa du står i. «ChildItem» betyr «det som ligg inni».", prov: "Get-ChildItem" },
                { kode: "Set-Location Dokument", forklaring: "Går inn i mappa Dokument. «Set-Location» betyr «sett plassering».", prov: "Set-Location Dokument" },
                { kode: "Set-Location ..", forklaring: "To punktum betyr «mappa over». Då går du eitt steg opp igjen.", prov: "Set-Location .." }
            ]
        },
        {
            tittel: "Opprette filer og mapper",
            tekst: "Med <span class='kodeinline'>New-Item</span> lagar du nye ting. Du må seie kva type: <span class='kodeinline'>Directory</span> (mappe) eller <span class='kodeinline'>File</span> (fil). Parametrar startar alltid med eit minusteikn.",
            eks: [
                { kode: "New-Item -Name Prosjekt -ItemType Directory", forklaring: "Lagar ei ny mappe som heiter Prosjekt der du står no.", prov: "New-Item -Name Prosjekt -ItemType Directory" },
                { kode: "New-Item -Name hei.txt -ItemType File -Value \"Hei PowerShell\"", forklaring: "Lagar ei tekstfil som heiter hei.txt, med teksten «Hei PowerShell» i.", prov: "New-Item -Name hei.txt -ItemType File -Value \"Hei PowerShell\"" },
                { kode: "Get-Content hei.txt", forklaring: "Les og viser innhaldet i fila.", prov: "Get-Content hei.txt" },
                { kode: "Remove-Item hei.txt", forklaring: "Slettar fila. Ver forsiktig med denne i ei ekte terminal!", prov: "Remove-Item hei.txt" }
            ]
        },
        {
            tittel: "Variablar og enkle skript",
            tekst: "Ein <strong>variabel</strong> er ei lita eske der du lagar ein verdi. Namnet startar alltid med <span class='kodeinline'>$</span>. Eit <strong>skript</strong> er fleire kommandoar i ei fil som endar på <span class='kodeinline'>.ps1</span>.",
            eks: [
                { kode: "$namn = \"Frode\"", forklaring: "Lagar variabelen namn og legg inn teksten «Frode».", prov: "$namn = \"Frode\"" },
                { kode: "Write-Host \"Hei $namn\"", forklaring: "Set verdien frå variabelen inn i teksten. Det blir til «Hei Frode».", prov: "Write-Host \"Hei $namn\"" },
                { kode: "$a = 5\n$b = 3\nWrite-Host ($a + $b)", forklaring: "PowerShell kan rekne. Her blir svaret 8.", prov: "$a = 5" },
                { kode: "foreach ($tal in 1..3) { Write-Host \"Runde $tal\" }", forklaring: "Ei løkke: gjer det same fleire gonger. Her skriv ho ut «Runde 1», «Runde 2» og «Runde 3».", prov: "foreach ($tal in 1..3) { Write-Host \"Runde $tal\" }" },
                { kode: "# Fila hils.ps1\n$namn = Read-Host \"Kva heiter du\"\nWrite-Host \"Velkomen, $namn!\"", forklaring: "Eit ekte skript lagra som hils.ps1. Linja med # er ein kommentar som PowerShell ikkje køyrer. (Read-Host fungerer ikkje i denne terminalen.)", prov: null }
            ]
        }
    ];

    /* Oppgåver i terminalen. «sjekk» får tilstanden og seier om oppgåva er løyst. */
    var OPPG = [
        { id: "dato", tekst: "Vis dagens dato med ei PowerShell-kommando.", hint: "Kommandoen startar med «Get-» og slutar på «Date».",
          sjekk: function (s) { return s.sisteKmd === "get-date" && s.sisteOk; } },
        { id: "mappe", tekst: "Gå inn i mappa Dokument.", hint: "Bruk Set-Location og namnet på mappa. Sjå kva mapper som finst med Get-ChildItem.",
          sjekk: function (s) { return s.cwd.join("\\").toLowerCase() === "c:\\brukarar\\elev\\dokument"; } },
        { id: "nymappe", tekst: "Lag ei ny mappe som heiter Prosjekt.", hint: "New-Item -Name Prosjekt -ItemType Directory",
          sjekk: function (s) { return finnNoko("Prosjekt", "dir"); } },
        { id: "nyfil", tekst: "Lag fila hei.txt med teksten «Hei PowerShell» i.", hint: "Bruk New-Item med -ItemType File og -Value «Hei PowerShell», eller Set-Content.",
          sjekk: function (s) { var f = finnNoko("hei.txt", "file"); return !!f && /hei/i.test(f.content || ""); } },
        { id: "variabel", tekst: "Lag variabelen $namn med namnet ditt, og skriv han ut.", hint: "Først: $namn = \"Ola\". Deretter: Write-Host $namn.",
          sjekk: function (s) { return s.namnUtskrift; } }
    ];

    /* Quiz-spørsmål: a = svaralternativ, r = indeks til rett svar, f = forklaring */
    var SPM = [
        { q: "Kva er PowerShell?", a: ["Eit spel frå Microsoft", "Eit verktøy for å styre datamaskina med kommandoar", "Ein nettlesar"], r: 1, f: "PowerShell er eit kommandolinjeverktøy og skriptspråk frå Microsoft." },
        { q: "Korleis er kommandoar (cmdlets) i PowerShell bygde opp?", a: ["Verb-Substantiv, til dømes Get-Date", "Berre tal", "Substantiv_Verb_Tal"], r: 0, f: "Cmdlets har forma Verb-Substantiv. Get-Date betyr «hent dato»." },
        { q: "Kva kommando viser kva som ligg i ei mappe?", a: ["Get-ChildItem", "Show-Folder", "Set-Location"], r: 0, f: "Get-ChildItem viser filer og mapper i mappa du står i." },
        { q: "Kva gjer Set-Location ..?", a: ["Slettar mappa", "Går eitt steg opp til mappa over", "Lagar ei ny mappe"], r: 1, f: "To punktum (..) betyr mappa over. Set-Location .. flyttar deg eitt steg opp." },
        { q: "Kva kommando lagar ei ny mappe?", a: ["New-Item -ItemType Directory", "Make-Folder", "Create-File"], r: 0, f: "New-Item lagar nye ting. Med -ItemType Directory får du ei mappe." },
        { q: "Kva teikn startar namnet på ein variabel?", a: ["#", "$", "%"], r: 1, f: "Variablar startar med dollarteikn, til dømes $namn." },
        { q: "Kva gjer Get-Content notat.txt?", a: ["Slettar fila", "Viser innhaldet i fila", "Lagar fila"], r: 1, f: "Get-Content les innhaldet i ei fil og viser det." },
        { q: "Kva gjer Remove-Item?", a: ["Slettar ei fil eller mappe", "Kopierer ei fil", "Gir nytt namn"], r: 0, f: "Remove-Item fjernar filer og mapper. Ver forsiktig!" },
        { q: "Kva kommando skriv ut tekst på skjermen?", a: ["Print-Text", "Write-Host", "Say-Text"], r: 1, f: "Write-Host \"Hei\" skriv ut teksten Hei." },
        { q: "Kva fil-endelse har eit PowerShell-skript?", a: [".exe", ".ps1", ".doc"], r: 1, f: "PowerShell-skript lagrar ein som filer med endinga .ps1." },
        { q: "Kva brukar du for å få hjelp om ei kommando?", a: ["Get-Help", "Ask-Teacher", "Show-Manual"], r: 0, f: "Get-Help etterfølgd av kommandonamnet gir ei forklaring." }
    ];

    /* =====================================================
       3. Framgang og poeng (localStorage)
       ===================================================== */
    var LAGRINGSNOKKEL = "gruppe6-framgang-v1";
    var state = { nivaa: [], oppg: [], quiz: [], tema: "dark" };

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
            var rå = localStorage.getItem(LAGRINGSNOKKEL);
            if (!rå) { return; }
            var o = JSON.parse(rå);
            state.nivaa = gyldigListe(o.nivaa, NIVAA.length);
            state.oppg = (Array.isArray(o.oppg) ? o.oppg : []).filter(function (id) { return OPPG.some(function (x) { return x.id === id; }); });
            state.quiz = gyldigListe(o.quiz, SPM.length);
            state.tema = o.tema === "light" ? "light" : "dark";
        } catch (e) { /* ugyldig data: start på nytt */ }
    }

    function poeng() { return state.nivaa.length * 10 + state.oppg.length * 20 + state.quiz.length * 10; }
    function totalt() { return NIVAA.length + OPPG.length + SPM.length; }
    function ferdige() { return state.nivaa.length + state.oppg.length + state.quiz.length; }

    function oppdaterTopp() {
        var pst = Math.round(ferdige() / totalt() * 100);
        $("poengVis").textContent = String(poeng());
        $("framdriftBar").style.width = pst + "%";
        $("framdriftRot").setAttribute("aria-valuenow", String(pst));
        $("framdriftTekst").textContent = pst + " % fullført";
    }

    /* =====================================================
       4. Navigasjon og lys/mørk modus
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
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function settTema(tema) {
        state.tema = tema;
        document.documentElement.setAttribute("data-tema", tema);
        var lys = tema === "light";
        $("temaIkon").textContent = lys ? "☀️" : "🌙";
        $("temaTekst").textContent = lys ? "Lys" : "Mørk";
        $("temaKnapp").setAttribute("aria-pressed", lys ? "true" : "false");
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) { meta.setAttribute("content", lys ? "#f3f5fd" : "#0f1222"); }
        lagre();
    }

    /* =====================================================
       5. Nivåvisinga
       ===================================================== */

    /** Fargelegg kode: kommandoar, parametrar, tekst, variablar og kommentarar. */
    function fargeleggKode(tekst) {
        var ut = tekst.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // Ein regex som finn alle typar på éin gong, så ein ikkje fargar inni allereie fargelagt kode
        return ut.replace(/(#.*$)|("[^"]*"|'[^']*')|(\$\w+)|(\b[A-Z][a-z]+-[A-Z][A-Za-z]+\b)|(\s-[A-Za-z]+)/gm, function (m, kom, str, vari, kmd, par) {
            if (kom) { return "<span class='t-kom'>" + kom + "</span>"; }
            if (str) { return "<span class='t-str'>" + str + "</span>"; }
            if (vari) { return "<span class='t-var'>" + vari + "</span>"; }
            if (kmd) { return "<span class='t-kmd'>" + kmd + "</span>"; }
            return "<span class='t-par'>" + par + "</span>";
        });
    }

    function byggNivaa() {
        var liste = $("nivaaListe");
        liste.textContent = "";
        NIVAA.forEach(function (n, i) {
            var kort = el("article", "kort nivaa");
            kort.id = "nivaa" + (i + 1);

            var topp = el("div", "nivaa-topp");
            topp.appendChild(el("div", "nivaa-nr", String(i + 1)));
            topp.appendChild(el("h3", "", "Nivå " + (i + 1) + ": " + n.tittel));
            kort.appendChild(topp);

            var p = el("p");
            p.innerHTML = n.tekst; // Teksten er skriven av oss, ikkje av brukaren
            kort.appendChild(p);

            n.eks.forEach(function (e) {
                var boks = el("div", "eks");
                var pre = el("pre", "kode");
                pre.innerHTML = fargeleggKode(e.kode);
                boks.appendChild(pre);
                boks.appendChild(el("p", "muted", "👉 " + e.forklaring));
                if (e.prov) {
                    var b = el("button", "knapp sek liten-knapp", "▶ Prøv i terminalen");
                    b.type = "button";
                    b.addEventListener("click", function () {
                        gaaTil("terminal");
                        var inn = $("termInn");
                        inn.value = e.prov;
                        setTimeout(function () { inn.focus(); }, 250);
                    });
                    boks.appendChild(b);
                }
                kort.appendChild(boks);
            });

            var ferdig = el("button", "knapp", "");
            ferdig.type = "button";
            ferdig.addEventListener("click", function () {
                if (state.nivaa.indexOf(i) !== -1) { return; }
                state.nivaa.push(i);
                lagre();
                oppdaterNivaa();
                oppdaterTopp();
                toast("🎉 +10 poeng! Nivå " + (i + 1) + " er fullført");
            });
            kort.appendChild(ferdig);
            liste.appendChild(kort);
        });
        oppdaterNivaa();
    }

    function oppdaterNivaa() {
        $$(".nivaa").forEach(function (kort, i) {
            var ferdig = state.nivaa.indexOf(i) !== -1;
            kort.classList.toggle("ferdig", ferdig);
            var knapp = kort.lastChild;
            knapp.textContent = ferdig ? "✅ Fullført" : "✔ Marker som fullført (+10 poeng)";
            knapp.disabled = ferdig;
            knapp.classList.toggle("ferdig", ferdig);
        });
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
            if (brukaAlias) { leggTil(["💡 Tips: «" + delar[1] + "» er ein kortversjon (alias). Det fulle namnet er " + VISNAMN[namn] + ". Bruk det fulle namnet, så blir koden lettare å lese."], "info"); }
            return { ut: ut, ok: true, kmd: namn };
        } catch (e) {
            if (!(e instanceof PSFeil)) { throw e; }
            return { ut: [{ t: e.msg, c: "fel" }, { t: "💡 Hint: " + e.hint, c: "hint" }], ok: false, feil: true, kmd: "" };
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
        skrivLinje("Dette er ei øvingsteminal. Ingenting her påverkar den ekte datamaskina di.", "info");
        skrivLinje("Skriv Get-Command for å sjå kva du kan bruke, eller prøv ei oppgåve til høgre.", "info");
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
            toast("Terminalen er nullstilt");
        });
    }

    /* =====================================================
       7. Oppgåvene
       ===================================================== */
    var opneHint = {};

    function byggOppgaver() {
        var liste = $("oppgListe");
        liste.textContent = "";
        var forsteIkkjeFerdig = -1;
        OPPG.forEach(function (o, i) { if (forsteIkkjeFerdig === -1 && state.oppg.indexOf(o.id) === -1) { forsteIkkjeFerdig = i; } });

        OPPG.forEach(function (o, i) {
            var ferdig = state.oppg.indexOf(o.id) !== -1;
            var li = el("li", "oppg" + (ferdig ? " ferdig" : "") + (i === forsteIkkjeFerdig ? " aktiv" : ""));
            var topp = el("div", "oppg-topp");
            topp.appendChild(el("span", "oppg-ikon", ferdig ? "✅" : (i + 1) + "."));
            var tekstBoks = el("div");
            tekstBoks.appendChild(el("div", "", o.tekst));
            tekstBoks.appendChild(el("div", "oppg-poeng", ferdig ? "Fullført! +20 poeng" : "20 poeng"));
            topp.appendChild(tekstBoks);
            li.appendChild(topp);

            if (!ferdig) {
                var hb = el("button", "hint-knapp", opneHint[o.id] ? "Skjul hint" : "💡 Vis hint");
                hb.type = "button";
                hb.setAttribute("aria-expanded", opneHint[o.id] ? "true" : "false");
                hb.addEventListener("click", function () {
                    opneHint[o.id] = !opneHint[o.id];
                    byggOppgaver();
                });
                li.appendChild(hb);
                if (opneHint[o.id]) { li.appendChild(el("div", "hint-tekst", o.hint)); }
            }
            liste.appendChild(li);
        });
    }

    /** Køyrer etter kvar kommando: sjekkar om ei oppgåve er løyst. */
    function sjekkOppgaver() {
        var tilstand = { cwd: cwd, sisteKmd: term.sisteKmd, sisteOk: term.sisteOk, namnUtskrift: term.namnUtskrift };
        var nye = [];
        OPPG.forEach(function (o) {
            if (state.oppg.indexOf(o.id) === -1 && o.sjekk(tilstand)) { state.oppg.push(o.id); nye.push(o); }
        });
        if (nye.length) {
            lagre();
            byggOppgaver();
            oppdaterTopp();
            nye.forEach(function (o) { skrivLinje("🎉 Oppgåve løyst: " + o.tekst + " (+20 poeng)", "ok"); });
            toast("🎉 +" + (nye.length * 20) + " poeng! Oppgåve løyst");
            if (state.oppg.length === OPPG.length) { skrivLinje("🏁 Du har løyst alle oppgåvene. Flott jobba!", "ok"); }
        }
    }

    /* =====================================================
       8. Quizen
       ===================================================== */
    var qz = { rekkefolge: [], nr: 0, rette: 0, svart: false };

    function startQuiz() {
        qz.rekkefolge = stokk(SPM.map(function (_, i) { return i; }));
        qz.nr = 0; qz.rette = 0;
        visSpm();
    }

    function visSpm() {
        var idx = qz.rekkefolge[qz.nr];
        var s = SPM[idx];
        qz.svart = false;
        var kort = $("quizKort");
        kort.textContent = "";

        var topp = el("div", "quiz-topp");
        topp.appendChild(el("span", "", "Spørsmål " + (qz.nr + 1) + " av " + SPM.length));
        var rette = el("span", "", "Rette denne runden: " + qz.rette);
        topp.appendChild(rette);
        kort.appendChild(topp);

        var fr = el("div", "framdrift"); var f = el("div"); f.style.width = (qz.nr / SPM.length * 100) + "%"; fr.appendChild(f);
        kort.appendChild(fr);

        kort.appendChild(el("div", "quiz-spm", s.q));

        var alt = el("div", "svaralt");
        var knappar = [];
        var fb = el("div", "quiz-fb", "Vel eit svar.");
        fb.setAttribute("aria-live", "polite");
        var neste = el("button", "knapp", qz.nr === SPM.length - 1 ? "Sjå resultatet 🏁" : "Neste spørsmål ➜");
        neste.type = "button";
        neste.disabled = true;

        stokk(s.a.map(function (_, i) { return i; })).forEach(function (ai) {
            var b = el("button", "", s.a[ai]);
            b.type = "button";
            b.addEventListener("click", function () {
                if (qz.svart) { return; }
                qz.svart = true;
                var rett = ai === s.r;
                knappar.forEach(function (k) { k.b.disabled = true; if (k.i === s.r) { k.b.classList.add("rett"); } });
                if (!rett) { b.classList.add("feil"); }
                var nyttPoeng = false;
                if (rett) {
                    qz.rette++;
                    rette.textContent = "Rette denne runden: " + qz.rette;
                    if (state.quiz.indexOf(idx) === -1) { state.quiz.push(idx); lagre(); oppdaterTopp(); nyttPoeng = true; toast("🎉 +10 poeng!"); }
                }
                fb.className = "quiz-fb " + (rett ? "ok" : "nei");
                fb.textContent = (rett ? "✅ Riktig! " + (nyttPoeng ? "+10 poeng. " : "(Du har allereie fått poeng for dette spørsmålet.) ") : "❌ Feil. ") + s.f;
                neste.disabled = false;
                neste.focus();
            });
            knappar.push({ b: b, i: ai });
            alt.appendChild(b);
        });
        kort.appendChild(alt);
        kort.appendChild(fb);

        var rad = el("div", "knapperad");
        neste.addEventListener("click", function () {
            if (qz.nr < SPM.length - 1) { qz.nr++; visSpm(); } else { sluttQuiz(); }
        });
        rad.appendChild(neste);
        kort.appendChild(rad);
    }

    function sluttQuiz() {
        var n = SPM.length;
        var melding, ikon;
        if (qz.rette === n) { melding = "Perfekt! Du kan PowerShell!"; ikon = "🏆"; }
        else if (qz.rette >= n * 0.8) { melding = "Veldig bra! Du kan mykje om PowerShell."; ikon = "😎"; }
        else if (qz.rette >= n * 0.5) { melding = "Bra! Les nivåa ein gong til og prøv på nytt."; ikon = "🙂"; }
        else { melding = "Ingen fare! Øv i terminalen og prøv ein gong til."; ikon = "💪"; }

        var kort = $("quizKort");
        kort.textContent = "";
        var s = el("div", "quiz-slutt");
        s.appendChild(el("h3", "", "Ferdig! " + ikon));
        s.appendChild(el("div", "tal", qz.rette + " / " + n));
        s.appendChild(el("p", "stor", melding));
        s.appendChild(el("p", "muted", "Totalt har du " + poeng() + " poeng i kurset, og " + state.quiz.length + " av " + n + " quizspørsmål er fullførte."));
        var rad = el("div", "knapperad");
        rad.style.justifyContent = "center";
        var igjen = el("button", "knapp", "↺ Prøv igjen");
        igjen.type = "button";
        igjen.addEventListener("click", startQuiz);
        var tilT = el("button", "knapp sek", "⌨️ Øv i terminalen");
        tilT.type = "button";
        tilT.addEventListener("click", function () { gaaTil("terminal"); });
        rad.appendChild(igjen); rad.appendChild(tilT);
        s.appendChild(rad);
        kort.appendChild(s);
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
            b.addEventListener("click", function () { gaaTil(b.getAttribute("data-gaa")); });
        });

        $("nullAlt").addEventListener("click", function () {
            if (window.confirm("Vil du nullstille alle poeng og all framgang?")) {
                state.nivaa = []; state.oppg = []; state.quiz = [];
                opneHint = {};
                lagre();
                oppdaterNivaa(); byggOppgaver(); oppdaterTopp(); startQuiz();
                toast("Framgangen er nullstilt");
            }
        });

        byggNivaa();
        byggOppgaver();
        startTerminal();
        startQuiz();
        oppdaterTopp();

        var h = (location.hash || "").replace("#", "");
        gaaTil(VISNINGAR.indexOf(h) !== -1 ? h : "heim", false);
        window.scrollTo(0, 0);
    }

    start();
})();
