"""
generate_proposition.py — Lucid-Lab PDF proposal generator (HTML/CSS + Playwright)

Usage:
    python3 scripts/generate_proposition.py scripts/content_sinibaldi_pc.py
"""

import asyncio
import base64
import importlib.util
import sys
import tempfile
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = ROOT / "scripts"
OUT_DIR = ROOT / "docs" / "client-presentations"
LOGO = ROOT / "lucid-lab-brand" / "01-logo" / "png" / "logo-1024x1024-black-on-white.png"


def load_content(path: str) -> dict:
    spec = importlib.util.spec_from_file_location("content", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CONTENT


async def _generate(content_path: str):
    from playwright.async_api import async_playwright

    # Embed logo as base64 — works regardless of page origin
    logo_b64 = base64.b64encode(LOGO.read_bytes()).decode()
    logo_src = f"data:image/png;base64,{logo_b64}"

    content = load_content(content_path)
    content["logo_src"] = logo_src

    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=False)
    template_name = content.get("template_name", "proposition_template.html")
    html = env.get_template(template_name).render(**content)

    # Write to a temp file so page.goto() gives a real origin (needed for Google Fonts)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        tmp_path = f.name

    out_path = OUT_DIR / content["filename"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    client_short = content.get("client_short", content["client_name"].split(",")[0].strip())

    # Header: small logo + wordmark + document title (all inlined — no external CSS in header)
    header = f"""
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
      font-size:8pt; color:#666; width:100%; padding:6px 2.4cm 0;
      display:flex; align-items:center; gap:10px; box-sizing:border-box;
    ">
      <img src="{logo_src}" style="height:18px;width:auto;display:block;">
      <b style="color:#0A0A0A;font-weight:700;">Lucid-Lab</b>
      <span style="color:#D0D0D0;">·</span>
      <span>Proposition d'accompagnement · {client_short}</span>
    </div>"""

    footer = """
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
      font-size:7pt; color:#999; width:100%; padding:0 2.4cm;
      display:flex; justify-content:space-between; align-items:center;
      box-sizing:border-box;
    ">
      <span>Lucid-Lab · SAS au capital de 999 € · RCS Paris 104 672 050 · TVA FR 02 104 672 050 · info@lucid-lab.fr · lucid-lab.fr</span>
      <span><span class="pageNumber"></span>&thinsp;/&thinsp;<span class="totalPages"></span></span>
    </div>"""

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page()
        await page.goto(f"file://{tmp_path}", wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        await page.pdf(
            path=str(out_path),
            format="A4",
            margin={"top": "2.2cm", "bottom": "1.8cm", "left": "2.4cm", "right": "2.4cm"},
            print_background=True,
            display_header_footer=True,
            header_template=header,
            footer_template=footer,
        )
        await browser.close()

    Path(tmp_path).unlink(missing_ok=True)
    print(f"✓ PDF généré : {out_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/generate_proposition.py <content_file.py>")
        sys.exit(1)
    asyncio.run(_generate(sys.argv[1]))


if __name__ == "__main__":
    main()
