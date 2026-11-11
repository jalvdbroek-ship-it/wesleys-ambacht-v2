"""Bouwt de statische pagina's: src/pages/*.html + src/_layout.html -> projectroot.

Gebruik: python tools/build.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
LINKS = ["home", "winkel", "catering", "vergaderen", "over", "contact"]

JSONLD = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Wesley's Ambacht",
    "description": "Verse vis direct van de vismijn in Stellendam, ambachtelijke catering op locatie en een vergaderruimte met uitzicht over de buitenhaven. Zonder E-nummers, met verse kruiden uit de eigen tuin.",
    "telephone": "+31639581128",
    "email": "info@ambachtswinkel.nl",
    "priceRange": "€€",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Meester Snijderweg 5",
        "postalCode": "3251 LJ",
        "addressLocality": "Stellendam",
        "addressCountry": "NL",
    },
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "10:00", "closes": "18:00"}
    ],
    "sameAs": [
        "https://www.instagram.com/ambachtswinkel/",
        "https://www.facebook.com/people/De-Ambachtswinkel/100090758690891/",
    ],
}


def partial(name):
    return (SRC / "partials" / f"{name}.html").read_text(encoding="utf-8").strip()


def expand(text):
    for _ in range(3):
        text = re.sub(r"\{\{>\s*([\w-]+)\s*\}\}", lambda m: partial(m.group(1)), text)
    return text


def parse(path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", raw, re.S)
    meta = dict(line.split(":", 1) for line in m.group(1).splitlines() if ":" in line)
    return {k.strip(): v.strip() for k, v in meta.items()}, m.group(2)


def main():
    layout = (SRC / "_layout.html").read_text(encoding="utf-8")
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(page)
        out = layout
        for key in LINKS:
            out = out.replace("{{c_%s}}" % key, ' aria-current="page"' if meta.get("current") == key else "")
        ld = ""
        if meta.get("jsonld"):
            ld = '<script type="application/ld+json">' + json.dumps(JSONLD, ensure_ascii=False) + "</script>"
        out = out.replace("{{title}}", meta["title"]).replace("{{description}}", meta["description"])
        out = out.replace("{{jsonld}}", ld).replace("{{body}}", expand(body.strip()))
        (ROOT / page.name).write_text(out, encoding="utf-8")
        print("gebouwd:", page.name)


if __name__ == "__main__":
    main()
