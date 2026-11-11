# Wesley's Ambacht — Fire. Smoke. Craft.

Statische website voor Wesley's Ambacht (Ambachtswinkel, catering en vergaderruimte aan de buitenhaven van Stellendam). Gebouwd met HTML, CSS en JS, met GSAP 3.13.0 en ScrollTrigger. Geen build-stap nodig om de site te bekijken.

## Starten

```
python -m http.server 4173
```

Open daarna http://127.0.0.1:4173/. Elke andere statische server werkt ook.

- `?beweging=uit` achter een URL zet alle animaties uit (handig om te controleren). `prefers-reduced-motion` doet hetzelfde automatisch.

## Pagina's aanpassen

De HTML in de hoofdmap wordt gegenereerd uit `src/`. Pas dus `src/` aan en bouw opnieuw:

```
python tools/build.py
```

## Mappen

| Map | Inhoud |
| --- | --- |
| `*.html` | Gebouwde pagina's: home, ambachtswinkel, catering, vergaderen, over-ons, contact |
| `src/_layout.html` | Gedeelde kop (navigatie, menu), voet en scripts |
| `src/pages/` | De inhoud per pagina |
| `src/partials/` | Herbruikbare stukken: FAQ, reviews, partners, slot-oproep, iconen |
| `tools/build.py` | Zet `src/` om naar de pagina's |
| `assets/css/main.css` | Het hele design system (kleuren, typografie, componenten) |
| `assets/js/main.js` | Navigatie, openingstijden-status, vonken, scroll-motion, formulier |
| `assets/vendor/` | GSAP en ScrollTrigger (lokaal, vaste versie 3.13.0) |
| `assets/fonts/` | Anton en Figtree (lokaal gehost) |
| `assets/img/` | Foto's en logo (`logo-bord.png` is het logo met crèmekleurige vulling voor donkere achtergronden) |
| `assets/brochures/` | De zeven PDF-brochures |

## Ontwerp en motion

- Kleuren: houtskoolzwart met havenblauwe ondertoon, koper en amber als vuur. Teal alleen als klein detail.
- Foto's zijn warm en donker gegradeerd met CSS, zonder de bestanden aan te passen.
- **"Het vuur gaat aan"** (home): scrollgestuurde scène waarin een gloeiende cirkel de koude haven vervangt door het vuur. Vonken (canvas) nemen toe en reageren op de cursor.
- Verder: kopregels per woord, beeldmaskers, parallax, sticky storytelling (De kade, De rookoven, De tuin), cursor-voorbeeld bij de rijen en paginaovergangen via View Transitions (waar de browser dat ondersteunt).
- Op mobiel zijn er minder vonken. Bij `prefers-reduced-motion` zijn er geen vonken, geen pinning en geen animaties.

## Inhoud

- Alle teksten, prijzen, pakketten, buffetten, arrangementen, partners en reviews komen van de bestaande site (https://jalvdbroek-ship-it.github.io/wesleys-ambacht-site/).
- De melding "Van 26 oktober t/m 8 november zijn we gesloten" staat in `src/_layout.html` en verschijnt alleen binnen die periode (`data-van` en `data-tot`). Voor een nieuwe sluiting pas je alleen die datums en tekst aan.
- De status "Nu open" in de navigatie volgt di t/m za 10:00 tot 18:00 (tijdzone Europe/Amsterdam).
- Het aanvraagformulier verstuurt niets zelf: het toont een overzicht met knoppen voor e-mail (mailto) en WhatsApp. Er wordt niets opgeslagen.
- De Instagram-likes van de oude site zijn niet overgenomen; die zijn niet te controleren.

## Nog te doen bij livegang

- Canonical-URL en een absolute `og:image` instellen in `src/_layout.html` zodra het domein bekend is.
- Eventueel een echte formulierdienst koppelen als mailto niet genoeg is.
