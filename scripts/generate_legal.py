"""
generate_legal.py — Lucid-Lab BDC + Contrat PDF generator (HTML/CSS + Playwright)

Usage:
    python3 scripts/generate_legal.py scripts/content_sinibaldi_bdc_ctr.py
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
OUT_DIR = ROOT / "docs" / "legal-templates" / "generated"
LOGO = ROOT / "lucid-lab-brand" / "01-logo" / "png" / "logo-1024x1024-black-on-white.png"


def load_content(path: str) -> dict:
    spec = importlib.util.spec_from_file_location("content", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CONTENT


async def _render_pdf(page, html: str, out_path: Path, header: str, footer: str):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        tmp_path = f.name

    await page.goto(f"file://{tmp_path}", wait_until="networkidle")
    await page.evaluate("document.fonts.ready")
    await page.pdf(
        path=str(out_path),
        format="A4",
        margin={"top": "2.0cm", "bottom": "1.8cm", "left": "2.4cm", "right": "2.4cm"},
        print_background=True,
        display_header_footer=True,
        header_template=header,
        footer_template=footer,
    )
    Path(tmp_path).unlink(missing_ok=True)


async def _generate(content_path: str):
    from playwright.async_api import async_playwright

    logo_b64 = base64.b64encode(LOGO.read_bytes()).decode()
    logo_src = f"data:image/png;base64,{logo_b64}"

    content = load_content(content_path)
    content["logo_src"] = logo_src

    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=False)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    client_short = content.get("client_short", "")

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

        # ── BDC ──────────────────────────────────────────────────────────────
        bdc_header = f"""
        <div style="
          font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
          font-size:8pt; color:#666; width:100%; padding:6px 2.4cm 0;
          display:flex; align-items:center; gap:10px; box-sizing:border-box;
        ">
          <img src="{logo_src}" style="height:16px;width:auto;display:block;">
          <b style="color:#0A0A0A;font-weight:700;">Lucid-Lab</b>
          <span style="color:#D0D0D0;">·</span>
          <span>Proposition valant Bon de Commande · {client_short}</span>
        </div>"""

        bdc_html = env.get_template("bdc_template.html").render(**content)
        bdc_path = OUT_DIR / content["filename_bdc"]
        await _render_pdf(page, bdc_html, bdc_path, bdc_header, footer)
        print(f"✓ BDC généré : {bdc_path}")

        # ── Contrat ───────────────────────────────────────────────────────────
        ctr_header = f"""
        <div style="
          font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
          font-size:8pt; color:#666; width:100%; padding:6px 2.4cm 0;
          display:flex; align-items:center; gap:10px; box-sizing:border-box;
        ">
          <img src="{logo_src}" style="height:16px;width:auto;display:block;">
          <b style="color:#0A0A0A;font-weight:700;">Lucid-Lab</b>
          <span style="color:#D0D0D0;">·</span>
          <span>Contrat de prestation de services · {client_short}</span>
        </div>"""

        ctr_html = env.get_template("contrat_template.html").render(**content)
        ctr_path = OUT_DIR / content["filename_ctr"]
        await _render_pdf(page, ctr_html, ctr_path, ctr_header, footer)
        print(f"✓ CTR généré : {ctr_path}")

        await browser.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/generate_legal.py <content_file.py>")
        sys.exit(1)
    asyncio.run(_generate(sys.argv[1]))


if __name__ == "__main__":
    main()
