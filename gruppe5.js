/* Gruppe 5: DNS – JavaScript */
(function () {
    "use strict";

    var $ = function (sel, rot) { return (rot || document).querySelector(sel); };
    var $$ = function (sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); };

    /* =====================================================
       Meny og visningar
       ===================================================== */
    var visningar = ["heim", "slik", "lab", "quiz"];

    function visVisning(id, oppdaterHash) {
        if (visningar.indexOf(id) === -1) { id = "heim"; }
        $$(".visning").forEach(function (el) { el.classList.toggle("aktiv", el.id === id); });
        $$(".meny button").forEach(function (b) {
            var aktiv = b.getAttribute("data-visning") === id;
            b.classList.toggle("aktiv", aktiv);
            if (aktiv) { b.setAttribute("aria-current", "page"); } else { b.removeAttribute("aria-current"); }
        });
        if (id !== "slik") { stoppAnimasjon(); }
        if (id === "slik") { plasserPakke(animSteg < 0 ? 0 : STEG[animSteg].node, true); }
        if (oppdaterHash !== false && history.replaceState) { history.replaceState(null, "", "#" + id); }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    $$(".meny button").forEach(function (b) {
        b.addEventListener("click", function () { visVisning(b.getAttribute("data-visning")); });
    });
    $$("[data-gaa]").forEach(function (b) {
        b.addEventListener("click", function () { visVisning(b.getAttribute("data-gaa")); });
    });

    /* =====================================================
       Slik fungerer DNS – animasjon
       ===================================================== */
    var STEG = [
        { node: 0, tekst: "Du skriv eksempel.no i nettlesaren. Nettlesaren spør: «Kva er IP-adressa til eksempel.no?»" },
        { node: 1, tekst: "DNS-resolveren har ikkje svaret i minnet. Han byrjar å leite og spør rotserveren." },
        { node: 2, tekst: "Rotserveren seier: «Eg kjenner ikkje eksempel.no, men spør .no-serveren. Han kan hjelpe deg!»" },
        { node: 3, tekst: ".no-serveren seier: «Domenet eksempel.no høyrer til ein bestemt domeneserver. Spør han!»" },
        { node: 4, tekst: "Domeneserveren veit svaret: «eksempel.no har IP-adressa 203.0.113.42»" },
        { node: 1, tekst: "Resolveren får svaret. Han lagrar det ei stund (hurtigbuffer), og sender det vidare til deg." },
        { node: 0, tekst: "Nettlesaren har fått IP-adressa 203.0.113.42 og kan hente nettsida. Ferdig! 🎉" }
    ];

    var animSteg = -1;
    var animTimer = null;

    var scene = $("#scene");
    var pakke = $("#pakke");
    var noder = $$(".node", scene);

    function plasserPakke(nodeIdx, utanOvergang) {
        var n = noder[nodeIdx];
        if (!n || !n.offsetHeight) { return; }
        if (utanOvergang) { pakke.style.transition = "none"; }
        pakke.style.top = (n.offsetTop + (n.offsetHeight - pakke.offsetHeight) / 2) + "px";
        if (utanOvergang) {
            void pakke.offsetWidth;
            pakke.style.transition = "";
        }
    }

    function visSteg(i) {
        animSteg = i;
        var s = STEG[i];
        noder.forEach(function (n, idx) { n.classList.toggle("aktiv", idx === s.node); });
        plasserPakke(s.node);
        $("#stegTal").textContent = "Steg " + (i + 1) + " av " + STEG.length;
        $("#stegTekst").textContent = s.tekst;
        $("#framdrift").style.width = ((i + 1) / STEG.length * 100) + "%";
        var ferdig = i === STEG.length - 1;
        $("#animNeste").disabled = ferdig;
        if (ferdig) {
            stoppAnimasjon();
            $("#animStart").textContent = "▶ Spel igjen";
        }
    }

    function stoppAnimasjon() {
        if (animTimer) { clearInterval(animTimer); animTimer = null; }
        var b = $("#animStart");
        if (b && animSteg < STEG.length - 1) { b.textContent = animSteg < 0 ? "▶ Start" : "▶ Hald fram"; }
    }

    function nullstillAnimasjon() {
        stoppAnimasjon();
        animSteg = -1;
        noder.forEach(function (n) { n.classList.remove("aktiv"); });
        $("#stegTal").textContent = "Klar";
        $("#stegTekst").textContent = "Trykk «Start» for å sjå korleis eit domenenamn blir funne.";
        $("#framdrift").style.width = "0";
        $("#animNeste").disabled = false;
        $("#animStart").textContent = "▶ Start";
        plasserPakke(0);
    }

    $("#animStart").addEventListener("click", function () {
        if (animTimer) {
            stoppAnimasjon();
            $("#animStart").textContent = "▶ Hald fram";
            return;
        }
        if (animSteg >= STEG.length - 1) { nullstillAnimasjon(); }
        if (animSteg < 0) { visSteg(0); }
        $("#animStart").textContent = "⏸ Pause";
        animTimer = setInterval(function () {
            if (animSteg < STEG.length - 1) { visSteg(animSteg + 1); }
        }, 3200);
    });

    $("#animNeste").addEventListener("click", function () {
        stoppAnimasjon();
        if (animSteg < STEG.length - 1) { visSteg(animSteg + 1); }
        if (animSteg < STEG.length - 1) { $("#animStart").textContent = "▶ Hald fram"; }
    });

    $("#animNull").addEventListener("click", nullstillAnimasjon);

    window.addEventListener("resize", function () {
        if ($("#slik").classList.contains("aktiv")) { plasserPakke(animSteg < 0 ? 0 : STEG[animSteg].node, true); }
    });

    /* =====================================================
       DNS-lab – simulert oppslag
       ===================================================== */
    var hurtigbuffer = {};
    var labOpptatt = false;
    var labTimere = [];

    var KJENTE = {
        "stord.vgs.no": "158.37.42.10",
        "nrk.no": "160.68.205.231",
        "wikipedia.org": "185.15.59.224",
        "eksempel.no": "203.0.113.42"
    };

    function hash(tekst) {
        var h = 2166136261;
        for (var i = 0; i < tekst.length; i++) {
            h ^= tekst.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }

    function lagIp(domene) {
        if (KJENTE[domene]) { return KJENTE[domene]; }
        var h = hash(domene);
        var forste = [34, 52, 93, 104, 151, 185, 193, 212][h % 8];
        var b = (h >>> 3) % 256;
        var c = (h >>> 11) % 256;
        var d = ((h >>> 19) % 253) + 1;
        return forste + "." + b + "." + c + "." + d;
    }

    function reinsDomene(tekst) {
        var t = tekst.trim().toLowerCase();
        t = t.replace(/^[a-z]+:\/\//, "");
        t = t.split(/[\/?#]/)[0];
        t = t.replace(/:\d+$/, "");
        t = t.replace(/\.$/, "");
        return t;
    }

    function gyldigDomene(d) {
        return /^([a-z0-9æøå]([a-z0-9æøå-]{0,61}[a-z0-9æøå])?\.)+[a-zæøå]{2,}$/.test(d);
    }

    function leggTilLogg(ikon, tekst, klasse) {
        var li = document.createElement("li");
        if (klasse) { li.className = klasse; }
        var i = document.createElement("span");
        i.className = "ikon";
        i.setAttribute("aria-hidden", "true");
        i.textContent = ikon;
        var t = document.createElement("span");
        t.textContent = tekst;
        li.appendChild(i);
        li.appendChild(t);
        $("#labLogg").appendChild(li);
    }

    function ryddLab() {
        labTimere.forEach(clearTimeout);
        labTimere = [];
        labOpptatt = false;
        $("#labLogg").textContent = "";
        $("#labResultat").textContent = "";
        $("#labFeil").textContent = "";
        $("#labKnapp").disabled = false;
    }

    function visResultat(domene, ip, fraBuffer, ms) {
        var boks = document.createElement("div");
        boks.className = "resultat";

        var over = document.createElement("small");
        over.textContent = domene + " har IP-adressa";
        var ipEl = document.createElement("span");
        ipEl.className = "ip";
        ipEl.textContent = ip;

        var m1 = document.createElement("span");
        m1.className = "merkelapp";
        m1.textContent = "Type: A-post";
        var m2 = document.createElement("span");
        m2.className = "merkelapp";
        m2.textContent = "Tid: " + ms + " ms";
        var m3 = document.createElement("span");
        m3.className = "merkelapp" + (fraBuffer ? " cache" : "");
        m3.textContent = fraBuffer ? "⚡ Frå hurtigbuffer" : "🔎 Nytt oppslag";

        boks.appendChild(over);
        boks.appendChild(ipEl);
        boks.appendChild(m1);
        boks.appendChild(m2);
        boks.appendChild(m3);
        $("#labResultat").appendChild(boks);
    }

    function kjorOppslag(rått) {
        if (labOpptatt) { return; }
        ryddLab();

        var domene = reinsDomene(rått);
        if (!domene) {
            $("#labFeil").textContent = "Skriv inn eit domenenamn først, til dømes nrk.no.";
            return;
        }
        if (!gyldigDomene(domene)) {
            $("#labFeil").textContent = "«" + domene + "» ser ikkje ut som eit domenenamn. Prøv noko som nrk.no eller stord.vgs.no.";
            return;
        }

        $("#domene").value = domene;
        labOpptatt = true;
        $("#labKnapp").disabled = true;

        var delar = domene.split(".");
        var tld = "." + delar[delar.length - 1];
        var ip = lagIp(domene);
        var steg = [];

        if (hurtigbuffer[domene]) {
            steg = [
                ["💻", "Nettlesaren spør: «Kva er IP-adressa til " + domene + "?»", ""],
                ["⚡", "Resolveren sjekkar hurtigbufferen… Treff! Svaret er lagra frå sist.", "cache"]
            ];
        } else {
            steg = [
                ["💻", "Nettlesaren spør: «Kva er IP-adressa til " + domene + "?»", ""],
                ["🧭", "Resolveren sjekkar hurtigbufferen… Ingen treff. Han må leite.", ""],
                ["🌍", "Rotserveren svarar: «Spør " + tld + "-serveren.»", ""],
                ["🏷️", tld + "-serveren svarar: «Spør domeneserveren til " + delar.slice(-2).join(".") + ".»", ""],
                ["🗄️", "Domeneserveren svarar: «" + domene + " = " + ip + "»", ""],
                ["💾", "Resolveren lagrar svaret i hurtigbufferen og sender det til deg.", ""]
            ];
        }

        steg.forEach(function (s, i) {
            labTimere.push(setTimeout(function () {
                leggTilLogg(s[0], s[1], s[2]);
            }, i * 700));
        });

        labTimere.push(setTimeout(function () {
            var frå = !!hurtigbuffer[domene];
            var ms = frå ? 1 + (hash(domene) % 3) : 20 + (hash(domene + "t") % 60);
            hurtigbuffer[domene] = ip;
            visResultat(domene, ip, frå, ms);
            labOpptatt = false;
            $("#labKnapp").disabled = false;
        }, steg.length * 700 + 200));
    }

    $("#labSkjema").addEventListener("submit", function (e) {
        e.preventDefault();
        kjorOppslag($("#domene").value);
    });

    $$(".chip").forEach(function (c) {
        c.addEventListener("click", function () {
            $("#domene").value = c.getAttribute("data-domene");
            kjorOppslag(c.getAttribute("data-domene"));
        });
    });

    $("#labTom").addEventListener("click", function () {
        hurtigbuffer = {};
        $("#labFeil").textContent = "";
        leggTilLogg("🧹", "Hurtigbufferen er tømd. Neste oppslag blir eit heilt nytt.", "cache");
    });

    $("#labNull").addEventListener("click", function () {
        ryddLab();
        $("#domene").value = "";
        $("#domene").focus();
    });

    /* =====================================================
       Quiz
       ===================================================== */
    var POENG_PER_SPM = 20;

    var SPORSMAL = [
        {
            q: "Kva er DNS?",
            alt: ["Ei slags telefonbok for internett", "Eit program som stoppar virus", "Ei nettside der du kan spele"],
            riktig: 0,
            ok: "Rett! DNS gjer om namn til tal, som ei telefonbok.",
            nei: "Ikkje heilt. DNS er som ei telefonbok: han gjer om namn til tal."
        },
        {
            q: "Kva får du tilbake når DNS finn eit domenenamn?",
            alt: ["Eit passord", "Ei IP-adresse", "Eit bilete av nettsida"],
            riktig: 1,
            ok: "Riktig! IP-adressa fortel kvar nettsida bur på internett.",
            nei: "Nei. Du får ei IP-adresse, altså talet som fortel kvar nettsida bur."
        },
        {
            q: "Kva av desse er eit domenenamn?",
            alt: ["192.168.1.1", "stord.vgs.no", "8.8.8.8"],
            riktig: 1,
            ok: "Bra! stord.vgs.no er eit namn. Dei to andre er IP-adresser.",
            nei: "Ikkje denne. Domenenamn er bokstavnamn som stord.vgs.no. Tala er IP-adresser."
        },
        {
            q: "Kvifor opnar ei nettside ofte raskare andre gongen?",
            alt: ["Svaret er lagra i ein hurtigbuffer", "Internett blir sterkare", "Nettsida blir mindre"],
            riktig: 0,
            ok: "Heilt rett! Hurtigbufferen hugsar svaret ei stund, så slepp ein å leite på nytt.",
            nei: "Nei. Svaret blir lagra i ein hurtigbuffer (cache), så DNS slepp å leite på nytt."
        },
        {
            q: "Kva skjer om DNS sluttar å fungere?",
            alt: ["Internett er borte for alltid", "Du kan ikkje opne sider med namn, men kan ofte bruke IP-adressa", "Datamaskina tek fyr"],
            riktig: 1,
            ok: "Smart! Utan DNS finn du ikkje namna, men IP-adressene finst framleis.",
            nei: "Nesten. Utan DNS finn ikkje maskina namna, men sidene finst framleis og kan nåast med IP-adressa."
        }
    ];

    var kviz = { nr: 0, poeng: 0, rekkefolge: [], svart: false };
    var quizKort = $("#quizKort");

    function stokk(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function el(tag, klasse, tekst) {
        var e = document.createElement(tag);
        if (klasse) { e.className = klasse; }
        if (tekst !== undefined) { e.textContent = tekst; }
        return e;
    }

    function startQuiz() {
        kviz.nr = 0;
        kviz.poeng = 0;
        kviz.svart = false;
        visSporsmal();
    }

    function visSporsmal() {
        var spm = SPORSMAL[kviz.nr];
        kviz.svart = false;
        quizKort.textContent = "";

        var topp = el("div", "quiz-topp");
        topp.appendChild(el("span", "", "Spørsmål " + (kviz.nr + 1) + " av " + SPORSMAL.length));
        topp.appendChild(el("span", "", "Poeng: " + kviz.poeng));
        quizKort.appendChild(topp);

        var bar = el("div", "framdrift");
        var fyll = el("div");
        fyll.style.width = (kviz.nr / SPORSMAL.length * 100) + "%";
        bar.appendChild(fyll);
        quizKort.appendChild(bar);

        quizKort.appendChild(el("div", "spm", spm.q));

        var rekkefolge = stokk(spm.alt.map(function (_, i) { return i; }));
        var liste = el("div", "svaralt");
        var knappar = [];

        var tilbake = el("div", "tilbakemelding", "Vel eit svar.");
        tilbake.setAttribute("aria-live", "polite");

        var neste = el("button", "knapp", kviz.nr === SPORSMAL.length - 1 ? "Sjå resultatet 🏁" : "Neste spørsmål ➜");
        neste.type = "button";
        neste.disabled = true;

        rekkefolge.forEach(function (origIdx) {
            var b = el("button", "", spm.alt[origIdx]);
            b.type = "button";
            b.addEventListener("click", function () {
                if (kviz.svart) { return; }
                kviz.svart = true;
                var rett = origIdx === spm.riktig;
                if (rett) { kviz.poeng += POENG_PER_SPM; }

                knappar.forEach(function (k) {
                    k.el.disabled = true;
                    if (k.idx === spm.riktig) { k.el.classList.add("riktig"); }
                });
                if (!rett) { b.classList.add("feil-val"); }

                tilbake.className = "tilbakemelding " + (rett ? "ok" : "nei");
                tilbake.textContent = (rett ? "✅ +" + POENG_PER_SPM + " poeng. " : "❌ 0 poeng. ") + (rett ? spm.ok : spm.nei);
                topp.lastChild.textContent = "Poeng: " + kviz.poeng;
                neste.disabled = false;
                neste.focus();
            });
            knappar.push({ el: b, idx: origIdx });
            liste.appendChild(b);
        });

        quizKort.appendChild(liste);
        quizKort.appendChild(tilbake);

        var rad = el("div", "knapperad");
        neste.addEventListener("click", function () {
            if (kviz.nr < SPORSMAL.length - 1) {
                kviz.nr++;
                visSporsmal();
            } else {
                visResultat2();
            }
        });
        rad.appendChild(neste);
        quizKort.appendChild(rad);
    }

    function visResultat2() {
        var maks = SPORSMAL.length * POENG_PER_SPM;
        var rette = kviz.poeng / POENG_PER_SPM;
        var emoji, melding;
        if (rette === SPORSMAL.length) {
            emoji = "🏆"; melding = "Perfekt! Du er ein ekte DNS-ekspert!";
        } else if (rette >= 3) {
            emoji = "😎"; melding = "Bra jobba! Du kan mykje om DNS.";
        } else if (rette >= 1) {
            emoji = "🙂"; melding = "Ikkje dårleg! Sjå animasjonen ein gong til og prøv igjen.";
        } else {
            emoji = "💪"; melding = "Ingen fare! Sjå animasjonen og prøv DNS-lab, så tek du det neste gong.";
        }

        quizKort.textContent = "";
        var boks = el("div", "sluttpoeng");
        boks.appendChild(el("h2", "", "Ferdig! " + emoji));

        var tal = el("div", "tal", String(kviz.poeng));
        tal.appendChild(el("small", "", " / " + maks));
        boks.appendChild(tal);

        boks.appendChild(el("p", "stor", rette + " av " + SPORSMAL.length + " rette"));
        var stjerner = el("div", "stjerner", "");
        stjerner.setAttribute("aria-hidden", "true");
        stjerner.textContent = "★".repeat(rette) + "☆".repeat(SPORSMAL.length - rette);
        boks.appendChild(stjerner);
        boks.appendChild(el("p", "", melding));

        var rad = el("div", "knapperad");
        rad.style.justifyContent = "center";
        var igjen = el("button", "knapp", "↺ Prøv igjen");
        igjen.type = "button";
        igjen.addEventListener("click", startQuiz);
        var animBtn = el("button", "knapp sekundaer", "🎬 Sjå animasjonen");
        animBtn.type = "button";
        animBtn.addEventListener("click", function () { visVisning("slik"); });
        rad.appendChild(igjen);
        rad.appendChild(animBtn);
        boks.appendChild(rad);

        quizKort.appendChild(boks);
    }

    /* =====================================================
       Oppstart
       ===================================================== */
    startQuiz();
    var start = (location.hash || "").replace("#", "");
    visVisning(visningar.indexOf(start) !== -1 ? start : "heim", false);
    window.scrollTo(0, 0);
})();
