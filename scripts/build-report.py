"""Regenerate REPORT.pdf from _index.json so the cover can never drift from feedback/."""

import json
import os
from collections import Counter

from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "REPORT.pdf")

entries = json.load(open(os.path.join(BASE, "_index.json")))
sev = Counter(e["severity"] for e in entries)
area = Counter(e["area"] for e in entries)

styles = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=18, spaceAfter=10)
h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=12, spaceBefore=14, spaceAfter=6)
body = ParagraphStyle(
    "body", parent=styles["BodyText"], fontSize=9.5, leading=14, alignment=TA_JUSTIFY
)
small = ParagraphStyle("small", parent=body, fontSize=8, leading=11, textColor="#555555")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor("#666666")
    canvas.drawString(
        18 * mm, 12 * mm, "dreamDEX Perps — build feedback — testnet survey, 2026-10-21"
    )
    canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, "%d" % doc.page)
    canvas.restoreState()


doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=18 * mm,
    bottomMargin=20 * mm,
    title="dreamDEX Perps — build feedback",
)
story = []

story.append(Paragraph("dreamDEX Perps — build feedback", h1))
story.append(
    Paragraph(
        "%d independently reproducible items (%d major, %d normal) across the REST API, "
        "the WebSocket feed, the docs, the deployed app, the bot kit and the perps "
        "contracts on Hideki (chain 50383). Each item is one Markdown file under "
        "<font face='Courier'>feedback/</font>, one issue per file, in the program's "
        "template." % (len(entries), sev.get("major", 0), sev.get("normal", 0)),
        body,
    )
)
story.append(Spacer(1, 8))
story.append(
    Paragraph(
        "Security items are not in this document or in the repository. They were sent "
        "privately to security@dreamdex.io as the rules require.",
        body,
    )
)

story.append(Paragraph("How each item is reproduced", h2))
story.append(
    Paragraph(
        "Most items carry the exact request and response inline: an HTTP status, a "
        "response body, a chain read, or a cited source line. Two items ship runnable "
        "scripts instead of transcripts. <font face='Courier'>scripts/perp-oi-cap/</font> "
        "enumerates the 21 perp pools from "
        "<font face='Courier'>PerpPoolFactory.getPerpPools()</font> on chain 50383 and "
        "compares <font face='Courier'>maxOpenInterest</font> and "
        "<font face='Courier'>maxPositionSize</font> against the trader docs table; it "
        "needs no wallet and no funds, every call is a read, and its non-zero exit is "
        "the finding rather than a crash. "
        "<font face='Courier'>scripts/dry-run-parsers/repro.ts</font> evaluates the four "
        "DRY_RUN parsers the bot-kit ships against the same environment strings and "
        "prints which packages disagree, offline, with no chain access.",
        body,
    )
)

story.append(Paragraph("What is deliberately absent", h2))
story.append(
    Paragraph(
        "Items that need funds, a signed message, a live authenticated session or a "
        "wallet that can reach testnet are not counted here, because this environment "
        "could not execute them. They are tracked separately with the exact check that "
        "remains. A finding whose claim did not survive re-reading the shipped source "
        "was removed rather than softened; three entries in an earlier draft were "
        "written against a paraphrase and were rewritten against the actual lines "
        "before this document was generated.",
        body,
    )
)

story.append(Paragraph("Distribution", h2))
rows = [
    "API: %d items" % area.get("API", 0),
    "docs: %d items" % area.get("docs", 0),
    "contracts: %d items" % area.get("contracts", 0),
    "SDK: %d items" % area.get("SDK", 0),
    "app: %d items" % area.get("app", 0),
]
story.append(
    ListFlowable(
        [ListItem(Paragraph(r, body), leftIndent=8) for r in rows],
        bulletType="bullet",
        start="square",
        leftIndent=14,
    )
)

story.append(Paragraph("Scope", h2))
story.append(
    Paragraph(
        "Everything here was observed on testnet against the surfaces the program "
        "exposes: the HTTP API on stg and api.testnet, the perps contracts on Hideki "
        "50383, the published docs, the web app, and the public bot-kit repository. No "
        "mainnet surface was touched, no third-party account was accessed, and no "
        "traffic beyond ordinary read requests and unauthenticated probes was sent. "
        "Where a behaviour depends on the contract rather than on the served code, the "
        "evidence is an ABI-level or RPC-level read and the item says so, so a reviewer "
        "can tell a source-confirmed claim from a behaviour-confirmed one.",
        body,
    )
)

story.append(PageBreak())
story.append(Paragraph("Index of items", h2))

hdr = ParagraphStyle("hdr", parent=body, fontName="Helvetica-Bold", fontSize=8)
cell = ParagraphStyle("cell", parent=body, fontSize=7.6, leading=10)
from reportlab.platypus import Table, TableStyle

data = [[Paragraph("#", hdr), Paragraph("Item", hdr), Paragraph("Sev", hdr), Paragraph("Area", hdr)]]
for e in entries:
    data.append(
        [
            Paragraph(e["id"], cell),
            Paragraph(e["title"], cell),
            Paragraph(e["severity"], cell),
            Paragraph(e["area"], cell),
        ]
    )
tbl = Table(data, colWidths=[10 * mm, 118 * mm, 16 * mm, 20 * mm], repeatRows=1)
tbl.setStyle(
    TableStyle(
        [
            ("GRID", (0, 0), (-1, -1), 0.25, "#cccccc"),
            ("BACKGROUND", (0, 0), (-1, 0), "#eeeeee"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]
    )
)
story.append(tbl)

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("wrote", OUT)
print("items", len(entries), dict(sev), dict(area))
