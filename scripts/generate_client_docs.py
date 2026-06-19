"""
generate_client_docs.py — Lucid-Lab : génère PropositionBDC + Contrat depuis un seul content file

Usage:
    python3 scripts/generate_client_docs.py scripts/content_<client>.py

Sorties:
    docs/client-presentations/<filename>           ← PropositionBDC
    docs/legal-templates/generated/<filename_ctr>  ← Contrat

Le script affiche en fin d'exécution :
    PROP_PATH=<chemin absolu>
    CTR_PATH=<chemin absolu>
    DRIVE_FOLDER=<folder_id>   (si drive_folder_id défini dans le content)
"""

import asyncio
import base64
import importlib.util
import subprocess
import sys
import tempfile
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = ROOT / "scripts"
OUT_PROP = ROOT / "docs" / "client-presentations"
OUT_LEGAL = ROOT / "docs" / "legal-templates" / "generated"
LOGO = ROOT / "lucid-lab-brand" / "01-logo" / "png" / "logo-256x256-black-on-white.png"

FOOTER = """
<div style="
  font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
  font-size:7pt; color:#999; width:100%; padding:0 2.4cm;
  display:flex; justify-content:space-between; align-items:center;
  box-sizing:border-box;
">
  <span>Lucid-Lab · SAS au capital de 999 € · RCS Paris 104 672 050 · TVA FR 02 104 672 050 · info@lucid-lab.fr · lucid-lab.fr</span>
  <span><span class="pageNumber"></span>&thinsp;/&thinsp;<span class="totalPages"></span></span>
</div>"""


def load_content(path: str) -> dict:
    spec = importlib.util.spec_from_file_location("content", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CONTENT


def make_header(logo_src: str, subtitle: str) -> str:
    return f"""
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
      font-size:8pt; color:#666; width:100%; padding:6px 2.4cm 0;
      display:flex; align-items:center; gap:10px; box-sizing:border-box;
    ">
      <img src="{logo_src}" style="height:18px;width:auto;display:block;">
      <b style="color:#0A0A0A;font-weight:700;">Lucid-Lab</b>
      <span style="color:#D0D0D0;">·</span>
      <span>{subtitle}</span>
    </div>"""


async def render_pdf(env, template_name, content, out_path, header):
    from playwright.async_api import async_playwright

    html = env.get_template(template_name).render(**content)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        tmp = f.name

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page()
        await page.goto(f"file://{tmp}", wait_until="networkidle")
        await page.evaluate("document.fonts.ready")
        await page.pdf(
            path=str(out_path),
            format="A4",
            margin={"top": "2.2cm", "bottom": "1.8cm", "left": "2.4cm", "right": "2.4cm"},
            print_background=True,
            display_header_footer=True,
            header_template=header,
            footer_template=FOOTER,
        )
        await browser.close()

    Path(tmp).unlink(missing_ok=True)


async def _generate(content_path: str):
    logo_b64 = base64.b64encode(LOGO.read_bytes()).decode()
    logo_src = f"data:image/png;base64,{logo_b64}"

    content = load_content(content_path)
    content["logo_src"] = logo_src

    client_short = content.get("client_short", "Client")
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=False)

    OUT_PROP.mkdir(parents=True, exist_ok=True)
    OUT_LEGAL.mkdir(parents=True, exist_ok=True)

    # ── 1. PropositionBDC ────────────────────────────────────────────────────
    template_prop = content.get("template_name", "proposition_bdc_template.html")
    filename_prop = content.get("filename") or content.get("filename_propositionbdc")
    out_prop = OUT_PROP / filename_prop

    header_prop = make_header(logo_src, f"Proposition d'accompagnement · {client_short}")
    await render_pdf(env, template_prop, content, out_prop, header_prop)
    print(f"✓ PropositionBDC : {out_prop}")

    # ── 2. Contrat ───────────────────────────────────────────────────────────
    filename_ctr = content.get("filename_ctr")
    if not filename_ctr:
        print("⚠ Pas de filename_ctr dans le content — contrat ignoré.")
        print(f"PROP_PATH={out_prop}")
        return

    out_ctr = OUT_LEGAL / filename_ctr
    header_ctr = make_header(logo_src, f"Contrat de prestation · {client_short}")
    await render_pdf(env, "contrat_template.html", content, out_ctr, header_ctr)
    print(f"✓ Contrat      : {out_ctr}")

    # ── 3. Upload Drive via rclone ───────────────────────────────────────────
    drive_folder = content.get("drive_folder_id", "")
    if drive_folder:
        for pdf_path in (out_prop, out_ctr):
            result = subprocess.run(
                [
                    "rclone", "copy", str(pdf_path), "gdrive:",
                    f"--drive-root-folder-id={drive_folder}",
                    "--no-traverse",
                ],
                capture_output=True, text=True,
            )
            if result.returncode == 0:
                print(f"☁ Drive ← {pdf_path.name}")
            else:
                print(f"⚠ Drive upload échoué pour {pdf_path.name}: {result.stderr.strip()}")

    # ── Sorties machine-lisibles ─────────────────────────────────────────────
    print(f"PROP_PATH={out_prop}")
    print(f"CTR_PATH={out_ctr}")
    if drive_folder:
        print(f"DRIVE_FOLDER={drive_folder}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/generate_client_docs.py <content_file.py>")
        sys.exit(1)
    asyncio.run(_generate(sys.argv[1]))


if __name__ == "__main__":
    main()
