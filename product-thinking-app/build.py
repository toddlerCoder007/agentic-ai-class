"""Build the single-file artifact version of Problem Quest.

Usage:  python product-thinking-app/build.py
Writes: product-thinking-app/dist/problem-quest.html

The artifact host wraps the page in its own <html>/<head>/<body>, so the output is a
fragment: the head block (title, fonts) followed by the body block, with style.css and
the three scripts inlined.
"""
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent


def between(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0].strip()


def main() -> None:
    page = (HERE / "index.html").read_text(encoding="utf-8")
    head = between(page, "<!--HEAD-START-->", "<!--HEAD-END-->")
    body = between(page, "<!--BODY-START-->", "<!--BODY-END-->")

    css = (HERE / "style.css").read_text(encoding="utf-8")
    link = '<link rel="stylesheet" href="style.css">'
    assert link in head, "style.css link not found"
    head = head.replace(link, "<style>\n" + css + "</style>")

    def inline(match: re.Match) -> str:
        js = (HERE / match.group(1)).read_text(encoding="utf-8")
        assert "</script" not in js, f"{match.group(1)} contains a closing script tag"
        return "<script>\n" + js + "</script>"

    body, n = re.subn(r'<script src="([^"]+)"></script>', inline, body)
    assert n == 3, f"expected 3 scripts, inlined {n}"

    out = HERE / "dist" / "problem-quest.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(head + "\n" + body + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")

    # A local stand-in for the artifact host's wrapper, for testing the built file.
    preview = HERE / "dist" / "preview.html"
    preview.write_text(
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "<style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}"
        "body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>\n"
        "</head><body>\n" + head + "\n" + body + "\n</body></html>\n",
        encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
