"""Build single-file copies of lessons/reference pages for publishing as claude.ai artifacts.

- Strips the document skeleton (the artifact host adds its own).
- Inlines ../assets/course.css and ../assets/components.js.
- Rewrites links to other workspace pages to their artifact URLs (from build/published.json);
  links to pages not yet published are reduced to plain text.

Usage: python scripts/build_artifacts.py
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "build")
PAGES = sorted(
    ["lessons/" + f for f in os.listdir(os.path.join(ROOT, "lessons")) if f.endswith(".html")]
    + ["reference/" + f for f in os.listdir(os.path.join(ROOT, "reference")) if f.endswith(".html")]
)
SKELETON = [
    "<!doctype html>\n", '<html lang="en">\n', "<head>\n", "</head>\n", "<body>\n", "</body>\n", "</html>\n",
    '<meta charset="utf-8">\n',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n',
]


def read(rel):
    with io.open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def main():
    os.makedirs(BUILD, exist_ok=True)
    map_path = os.path.join(BUILD, "published.json")
    published = json.load(io.open(map_path, encoding="utf-8")) if os.path.exists(map_path) else {}
    css, js = read("assets/course.css"), read("assets/components.js")

    for rel in PAGES:
        s = read(rel)
        for t in SKELETON:
            s = s.replace(t, "", 1)
        s = s.replace('<link rel="stylesheet" href="../assets/course.css">', "<style>\n" + css + "</style>")
        s = s.replace('<script src="../assets/components.js"></script>', "<script>\n" + js + "</script>")

        def link(m):
            url = published.get(m.group(2))
            return '<a%shref="%s"%s>%s</a>' % (m.group(1), url, m.group(3), m.group(4)) if url else m.group(4)

        # href may come after other attributes, e.g. <a class="btn" href="../lessons/x.html">.
        s = re.sub(r'<a(\s[^>]*?)href="\.\./((?:lessons|reference)/[^"]+\.html)"([^>]*)>(.*?)</a>',
                   link, s, flags=re.S)
        leftover = re.findall(r'.{0,40}\.\./.{0,40}', s)
        if leftover:
            raise SystemExit("Unresolved relative path in %s: %s" % (rel, leftover))
        out = os.path.join(BUILD, os.path.basename(rel))
        with io.open(out, "w", encoding="utf-8") as f:
            f.write(s)
        print("built", out, "(%d bytes)" % len(s), "->", published.get(rel, "NOT YET PUBLISHED"))


if __name__ == "__main__":
    main()
