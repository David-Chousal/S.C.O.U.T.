#!/usr/bin/env python3
"""Convert METHODOLOGY.md to SCOUT_Methodology.pdf using reportlab."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Arial Unicode for full Greek/math symbol support
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
pdfmetrics.registerFont(TTFont("ArialUnicode", FONT_PATH))
pdfmetrics.registerFont(TTFont("ArialUnicode-Bold",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("ArialUnicode-Italic",
    "/System/Library/Fonts/Supplemental/Arial Italic.ttf"))
pdfmetrics.registerFont(TTFont("ArialUnicode-BoldItalic",
    "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf"))

OUTPUT = "/Users/davidchousal/Desktop/S.C.O.U.T./SCOUT_Methodology.pdf"

NAVY  = colors.HexColor("#1a3a5c")
BLUE  = colors.HexColor("#2471a3")
TEAL  = colors.HexColor("#117a65")
GRAY  = colors.HexColor("#555555")
LGRAY = colors.HexColor("#f4f6f7")
BORD  = colors.HexColor("#aab7b8")
WHITE = colors.white

def S(name, **kw):
    base = dict(fontName="ArialUnicode", fontSize=10, leading=15, spaceAfter=5)
    base.update(kw)
    return ParagraphStyle(name, **base)

ST = {
    "title":    S("title",   fontSize=22, fontName="ArialUnicode-Bold",
                  textColor=NAVY, alignment=TA_CENTER, spaceAfter=4),
    "subtitle": S("subtitle", fontSize=11, textColor=BLUE,
                  alignment=TA_CENTER, spaceAfter=4),
    "acro":     S("acro",    fontSize=10, textColor=GRAY,
                  alignment=TA_CENTER, spaceAfter=20),
    "h2":       S("h2",      fontSize=15, fontName="ArialUnicode-Bold",
                  textColor=NAVY, spaceBefore=18, spaceAfter=8),
    "h3":       S("h3",      fontSize=12, fontName="ArialUnicode-Bold",
                  textColor=BLUE, spaceBefore=12, spaceAfter=5),
    "h4":       S("h4",      fontSize=10.5, fontName="ArialUnicode-BoldItalic",
                  textColor=TEAL, spaceBefore=8, spaceAfter=4),
    "body":     S("body",    alignment=TA_JUSTIFY),
    "bullet":   S("bullet",  leftIndent=18, firstLineIndent=-12, spaceAfter=3),
    "sbullet":  S("sbullet", leftIndent=34, firstLineIndent=-12, spaceAfter=2,
                  fontSize=9.5),
    "eq":       S("eq",      fontName="ArialUnicode-Italic", fontSize=10.5,
                  alignment=TA_CENTER, spaceBefore=6, spaceAfter=6,
                  leftIndent=30, rightIndent=30),
    "ref":      S("ref",     fontSize=8.5, textColor=GRAY, leading=13,
                  leftIndent=20, firstLineIndent=-20, spaceAfter=4),
    "callout":  S("callout", fontSize=9.5, fontName="ArialUnicode-Italic",
                  textColor=GRAY, leftIndent=14, rightIndent=14, spaceAfter=6),
    "toc":      S("toc",     fontSize=10, leading=18, leftIndent=12),
    "footer":   S("footer",  fontSize=8, textColor=colors.HexColor("#999999"),
                  alignment=TA_CENTER),
}

def hr():
    return HRFlowable(width="100%", thickness=0.75, color=BORD,
                      spaceBefore=4, spaceAfter=6)

def sp(h=6):
    return Spacer(1, h)

def p(text, style="body"):
    return Paragraph(text, ST[style])

def b(text, indent=0):
    bullet = "•  " + text
    style = "sbullet" if indent else "bullet"
    return Paragraph(bullet, ST[style])

def eq(text):
    return Paragraph(text, ST["eq"])

def ref(text):
    return Paragraph(text, ST["ref"])

def section_table(data, col_widths, header_row=True):
    style = [
        ("BACKGROUND", (0, 0), (-1, 0 if header_row else -1), LGRAY),
        ("TEXTCOLOR",  (0, 0), (-1, -1), colors.black),
        ("FONTNAME",   (0, 0), (-1, 0),  "ArialUnicode-Bold"),
        ("FONTNAME",   (0, 1), (-1, -1), "ArialUnicode"),
        ("FONTSIZE",   (0, 0), (-1, -1), 9),
        ("LEADING",    (0, 0), (-1, -1), 13),
        ("GRID",       (0, 0), (-1, -1), 0.5, BORD),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#f9fbfc")]),
        ("PADDING",    (0, 0), (-1, -1), 5),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
    ]
    rows = []
    for row in data:
        rows.append([Paragraph(cell, ST["body"] if i > 0 or not header_row
                               else S("th", fontName="ArialUnicode-Bold",
                                      fontSize=9))
                     for i, cell in enumerate(row)])
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle(style))
    return t

def callout_box(text):
    data = [[Paragraph(text, ST["callout"])]]
    t = Table(data, colWidths=[6.3 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eaf4fc")),
        ("BOX",        (0, 0), (-1, -1), 1, BLUE),
        ("PADDING",    (0, 0), (-1, -1), 8),
    ]))
    return t


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("ArialUnicode", 8)
    canvas.setFillColor(colors.HexColor("#999999"))
    canvas.drawString(0.9 * inch, 0.5 * inch,
                      "SCOUT — Soundscape Coral Reef Observation and Underground Tracking")
    canvas.drawRightString(letter[0] - 0.9 * inch, 0.5 * inch,
                           f"Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.9*inch, rightMargin=0.9*inch,
        topMargin=0.85*inch, bottomMargin=0.75*inch,
    )
    story = []

    # ── Title block ─────────────────────────────────────────────────────────
    story += [
        sp(20),
        p("SCOUT Methodology", "title"),
        p("Soundscape Coral Reef Observation and Underground Tracking", "subtitle"),
        p("Passive Acoustic Monitoring Pipeline — Bioacoustic Indices, Trend Detection &amp; Reef Health Classification", "acro"),
        hr(),
        sp(4),
    ]

    # ── Executive Summary ────────────────────────────────────────────────────
    story += h2_block("Executive Summary")
    story.append(p(
        "SCOUT monitors coral reef health using passive acoustic recordings and five "
        "bioacoustic indices (ACI, BI, NDSI, H, ADI) computed from WAV files. Within a "
        "single recording session, recordings are ranked by a weighted composite health "
        "score and flagged for anthropogenic disturbances via z-score outlier detection. "
        "Across sessions, a modified Mann-Kendall trend test — corrected for temporal "
        "autocorrelation — detects monotonic decline or recovery in reef acoustic "
        "signatures over months to years."
    ))

    # ── Table of Contents ────────────────────────────────────────────────────
    story += h2_block("Contents")
    toc_items = [
        "1.  Bioacoustic Indices",
        "2.  Trend Detection",
        "3.  Seasonal Normalization",
        "4.  Disturbance Detection",
        "5.  Reef Health Classification",
        "6.  Data Sources",
        "7.  Limitations",
        "8.  Software Dependencies",
    ]
    for item in toc_items:
        story.append(p(item, "toc"))
    story.append(sp(10))

    # ═══════════════════════════════════════════════════════════════════════
    # 1. BIOACOUSTIC INDICES
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("1  Bioacoustic Indices")
    story.append(p(
        "All five indices are computed from WAV files resampled to 22,050 Hz using the "
        "<b>scikit-maad</b> Python library. ACI, BI, and ADI use the amplitude "
        "spectrogram; NDSI uses the power spectral density; H uses both the raw signal "
        "(temporal entropy) and the amplitude spectrogram (spectral entropy)."
    ))
    story.append(p("<b>Frequency band definitions:</b>"))
    story.append(b("<b>Biological band:</b> 1,000 – 8,000 Hz (snapping shrimp, fish calls, invertebrate activity)"))
    story.append(b("<b>Anthropogenic band:</b> 0 – 1,000 Hz (vessel engines, motors)"))
    story.append(sp(8))

    # ACI
    story += h3_block("ACI — Acoustic Complexity Index")
    story.append(p(
        "<b>Definition:</b> ACI measures the degree of change in sound intensity across "
        "adjacent time windows within each frequency band of a spectrogram, then sums "
        "these changes across the recording. High variation in intensity — the hallmark "
        "of biological choruses — produces a high ACI. Constant-frequency anthropogenic "
        "sounds (engines, motors) produce low ACI because their intensity profile is "
        "smooth and repetitive."
    ))
    story.append(eq(
        "ACI  =  ∑<sub>k</sub> ∑<sub>t</sub>  |I<sub>k,t</sub> − I<sub>k,t+1</sub>|  /  I<sub>k, total</sub>"
    ))
    story.append(p(
        "<b>Ecological interpretation:</b> ACI is the strongest per-recording proxy for "
        "biological activity and reef biodiversity. Declining ACI over months is "
        "consistent with reduced species richness — a pattern observed during reef "
        "degradation. ACI is robust to recording gain differences between sessions "
        "because it uses intensity <i>ratios</i> rather than absolute levels."
    ))
    story.append(p("<b>Weight in SCOUT composite score:</b> 0.30 (highest of the five indices)"))
    story.append(ref(
        "[Pieretti et al., 2011] — \"A new methodology to infer the singing activity of "
        "an avian community: The Acoustic Complexity Index (ACI)\" — "
        "<i>Ecological Indicators</i>, 11(3):868–873"
    ))
    story.append(sp(6))

    # BI
    story += h3_block("BI — Bioacoustic Index")
    story.append(p(
        "<b>Definition:</b> BI integrates the mean sound pressure level within the "
        "biological frequency band (1–8 kHz) across time, producing a scalar measure of "
        "biological energy in the recording."
    ))
    story.append(p(
        "<b>Ecological interpretation:</b> BI captures the total acoustic energy "
        "contributed by biological sources — fish calls, snapping shrimp, and other reef "
        "organisms. It is especially sensitive to snapping shrimp density (a dominant "
        "reef noise source) and correlates with live coral cover. BI shows strong "
        "seasonal variation at Sesoko, peaking July–October when invertebrate activity "
        "is highest."
    ))
    story.append(p("<b>Weight in SCOUT composite score:</b> 0.25"))
    story.append(ref(
        "[Boelman et al., 2007] — \"Multi-trophic invasion resistance in Hawaii: "
        "bioacoustics, field surveys, and airborne remote sensing\" — "
        "<i>Ecological Applications</i>, 17(8):2137–2144"
    ))
    story.append(sp(6))

    # NDSI
    story += h3_block("NDSI — Normalized Difference Soundscape Index")
    story.append(p(
        "<b>Definition:</b> NDSI measures the ratio of biological-band energy to "
        "anthropogenic-band energy, normalized to [−1, +1]:"
    ))
    story.append(eq(
        "NDSI  =  (β − α) / (β + α)"
    ))
    story.append(p(
        "where β is integrated power in the biological band (1–8 kHz) and α is "
        "integrated power in the anthropogenic band (0–1 kHz). "
        "NDSI = +1 indicates a purely biophonic soundscape; NDSI = −1 indicates "
        "a purely anthropophonic soundscape."
    ))
    story.append(p(
        "<b>Ecological interpretation:</b> NDSI is the primary indicator of "
        "anthropogenic noise pressure. A healthy, undisturbed reef consistently achieves "
        "NDSI > 0. Sustained negative NDSI drift may indicate chronic vessel traffic, "
        "proximity to industrial activity, or progressive reef simplification. NDSI is "
        "also the primary input to disturbance detection."
    ))
    story.append(p("<b>Weight in SCOUT composite score:</b> 0.20"))
    story.append(ref(
        "[Kasten et al., 2012] — \"The remote environmental assessment laboratory's "
        "acoustic library: An archive for studying soundscape ecology\" — "
        "<i>Ecological Informatics</i>, 12:50–67"
    ))
    story.append(sp(6))

    # H
    story += h3_block("H — Acoustic Entropy")
    story.append(p(
        "<b>Definition:</b> H is the product of two independent entropy measures:"
    ))
    story.append(eq("H  =  H<sub>t</sub>  ×  H<sub>f</sub>"))
    story.append(b(
        "<b>Temporal entropy (H<sub>t</sub>):</b> Shannon entropy of the normalized "
        "energy envelope over time — how evenly energy is distributed across time steps."
    ))
    story.append(b(
        "<b>Spectral entropy (H<sub>f</sub>):</b> Shannon entropy of the normalized "
        "mean power spectrum — how evenly energy is distributed across frequency bins."
    ))
    story.append(sp(4))
    story.append(p(
        "<b>Ecological interpretation:</b> H captures overall soundscape complexity "
        "without targeting any specific frequency band. It complements ACI: ACI measures "
        "temporal <i>variability within</i> frequency bins, while H measures the "
        "<i>distribution</i> of energy across bins and time."
    ))
    story.append(p("<b>Weight in SCOUT composite score:</b> 0.15"))
    story.append(ref(
        "[Sueur et al., 2008] — \"Rapid acoustic survey for biodiversity appraisal\" — "
        "<i>PLOS ONE</i>, 3(12):e4065"
    ))
    story.append(sp(6))

    # ADI
    story += h3_block("ADI — Acoustic Diversity Index")
    story.append(p(
        "<b>Definition:</b> ADI applies the Shannon diversity index to frequency bands, "
        "scoring each band as active if its mean amplitude exceeds a threshold:"
    ))
    story.append(eq("ADI  =  −∑<sub>i</sub>  p<sub>i</sub> ln(p<sub>i</sub>)"))
    story.append(p(
        "where p<sub>i</sub> is the proportion of active bands occupied by band i."
    ))
    story.append(p(
        "<b>Ecological interpretation:</b> ADI measures the diversity of acoustic niches "
        "in use. A species-rich reef, with fish, shrimp, and invertebrates vocalizing "
        "across many frequency ranges simultaneously, produces high ADI. Monodominant "
        "soundscapes or acoustically degraded sites produce low ADI. ADI is the most "
        "direct acoustic analogue to species richness within the soundscape ecology "
        "framework."
    ))
    story.append(p("<b>Weight in SCOUT composite score:</b> 0.10"))
    story.append(ref(
        "[Villanueva-Rivera et al., 2011] — \"A primer of acoustic analysis for "
        "landscape ecologists\" — <i>Landscape Ecology</i>, 26(9):1233–1246"
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # 2. TREND DETECTION
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("2  Trend Detection")

    story += h3_block("Why Mann-Kendall")
    story.append(p(
        "Acoustic indices are non-normally distributed time series with heavy-tailed "
        "behaviour from occasional disturbance events. SCOUT uses the "
        "<b>Mann-Kendall test</b> for three reasons:"
    ))
    story.append(b("<b>Non-parametric:</b> makes no assumption about the distribution of index values."))
    story.append(b(
        "<b>Monotonic test:</b> directly answers the ecologically relevant question — "
        "\"is this reef getting consistently worse or better over time?\" — without "
        "assuming a specific functional form."
    ))
    story.append(b(
        "<b>Outlier robustness:</b> the test statistic S counts concordant vs. "
        "discordant pairs of observations. A single extreme outlier changes at most "
        "n − 1 pairs, not the magnitude of deviation."
    ))
    story.append(sp(6))

    story += h3_block("Autocorrelation Correction (Hamed-Rao)")
    story.append(p(
        "Standard Mann-Kendall assumes temporal independence between observations. "
        "Adjacent monthly recordings at the same reef site are almost certainly "
        "autocorrelated — a healthy month is likely followed by another healthy month. "
        "This inflates the Type I error rate of the uncorrected test."
    ))
    story.append(p(
        "SCOUT uses the <b>modified Mann-Kendall test (Hamed &amp; Rao 1998)</b>, which "
        "adjusts the variance of the S-statistic for the autocorrelation structure of "
        "the series, producing honest p-values. When the series is perfectly monotonic "
        "(a degenerate case producing NaN), SCOUT falls back to the standard "
        "Mann-Kendall test."
    ))

    story += h3_block("Sen's Slope")
    story.append(p(
        "The <b>rate of change</b> is estimated by Sen's slope — the median of all "
        "pairwise slopes between observations:"
    ))
    story.append(eq(
        "β̂  =  median( (x<sub>j</sub> − x<sub>i</sub>) / (j − i) )    for all j &gt; i"
    ))
    story.append(p(
        "Sen's slope shares the same outlier robustness properties as Mann-Kendall "
        "because it uses the <i>median</i> rather than the mean of pairwise slopes. "
        "The slope is reported in units of index-value change per session interval."
    ))

    story += h3_block("Significance Thresholds")
    sig_data = [
        ["p-value", "Label", "Contribution to reef vote"],
        ["< 0.05", "significant", "± |τ|"],
        ["0.05 – 0.10", "marginal", "± 0.5 × |τ|"],
        ["≥ 0.10", "no trend", "0"],
    ]
    story.append(section_table(sig_data, [1.5*inch, 1.5*inch, 3.2*inch]))
    story.append(sp(8))
    story.append(callout_box(
        "<b>Statistical power caveat:</b> With n = 8 sessions, Mann-Kendall requires "
        "|τ| ≥ 0.64 for p &lt; 0.05 (two-sided). Results classified as \"no trend\" "
        "should be interpreted cautiously — absence of significance at n = 8 does not "
        "rule out a real but moderate decline. Power improves substantially beyond "
        "n = 12 sessions."
    ))
    story.append(sp(6))
    story.append(callout_box(
        "<b>Multiple testing note:</b> Five independent Mann-Kendall tests are run "
        "(one per index). The Bonferroni-corrected significance threshold per index is "
        "α = 0.01. The three primary voting indices (ACI, BI, NDSI) drive the overall "
        "reef classification; H and ADI are reported for context."
    ))
    story.append(sp(8))

    story += h3_block("Key References")
    for r in [
        "[Mann, 1945] — \"Nonparametric tests against trend\" — <i>Econometrica</i>, 13(3):245–259",
        "[Sen, 1968] — \"Estimates of the regression coefficient based on Kendall's tau\" — <i>JASA</i>, 63(324):1379–1389",
        "[Hamed &amp; Rao, 1998] — \"A modified Mann-Kendall trend test for autocorrelated data\" — <i>Journal of Hydrology</i>, 204(1–4):182–196",
        "[Hussain &amp; Mahmud, 2019] — \"pyMannKendall: a python package for non parametric Mann Kendall family of trend tests\" — <i>JOSS</i>, 4(39):1556",
    ]:
        story.append(ref(r))

    # ═══════════════════════════════════════════════════════════════════════
    # 3. SEASONAL NORMALIZATION
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("3  Seasonal Normalization")

    story += h3_block("Why Seasonal Bias Matters")
    story.append(p(
        "Coral reef acoustic activity is not constant across the year. At Sesoko Island "
        "(~26°N), biological index values follow a strong seasonal cycle driven by sea "
        "surface temperature and species-specific reproductive calendars:"
    ))
    story.append(b(
        "<b>Snapping shrimp</b> (<i>Alpheidae</i> spp.) — the dominant source of "
        "high-frequency reef noise — reduce snapping rate significantly in cooler months "
        "when water temperature drops below ~22°C. BI can be 40–65% lower in January "
        "than in August at the same healthy site."
    ))
    story.append(b(
        "<b>Nocturnal fish choruses</b> peak during the summer spawning season "
        "(July–September in Okinawa) and are largely absent in winter."
    ))
    story.append(b(
        "<b>Baiu (rainy season, May–June)</b> brings transitional acoustic patterns "
        "as water temperatures rise and summer species become active."
    ))
    story.append(sp(4))
    story.append(p(
        "Without correction, a winter recording at a healthy reef will look statistically "
        "similar to a summer recording at a degraded reef — the seasonal amplitude shift "
        "swamps the health signal."
    ))

    story += h3_block("Z-Score Normalization Within Season")
    story.append(p(
        "SCOUT removes seasonal bias by z-scoring each index value "
        "<i>within its season group</i>:"
    ))
    story.append(eq(
        "z<sub>i</sub>  =  (x<sub>i</sub> − μ<sub>season(i)</sub>) / σ<sub>season(i)</sub>"
    ))
    story.append(p(
        "A z-score of zero means \"typical for this time of year.\" A downward trend "
        "in z-scores over time means the reef is performing <i>increasingly below its "
        "seasonal baseline</i> — a genuine health signal rather than a calendar artifact."
    ))
    story.append(sp(6))

    story += h4_block("Okinawa Season Definitions")
    story.append(p(
        "Standard northern-hemisphere seasons do not match the ecological calendar at "
        "Sesoko Island. SCOUT uses three biologically meaningful seasons:"
    ))
    season_data = [
        ["Season", "Months", "Ecological rationale"],
        ["cool",   "Nov – Apr", "Lower SST; reduced shrimp and fish activity; lowest BI/ACI"],
        ["baiu",   "May – Jun", "Rainy season; rapid SST rise; transitional acoustic community"],
        ["hot",    "Jul – Oct", "Peak SST; spawning season; highest BI/ACI"],
    ]
    story.append(section_table(season_data, [0.9*inch, 1.1*inch, 4.2*inch]))
    story.append(sp(8))

    story += h4_block("Fallback Behaviour")
    story.append(p(
        "When a season group contains fewer than 2 sessions, SCOUT falls back to "
        "full-dataset z-scoring. A minimum standard deviation floor is applied: "
        "σ<sub>season</sub> = max(σ<sub>season</sub>, 0.01 × σ<sub>dataset</sub>) to "
        "prevent near-zero division from producing artificially extreme z-scores."
    ))

    story += h3_block("Limitations with &lt; 2 Years of Data")
    story.append(b(
        "Each season's z-score baseline is computed from the same observations being "
        "tested (in-sample normalization). With n = 2 sessions in baiu, each "
        "observation contributes 50% to the group mean."
    ))
    story.append(b(
        "Seasonal baselines are derived from a single year and do not yet represent "
        "a stable multi-year climatology for the site."
    ))
    story.append(b(
        "Accuracy of the seasonal correction improves linearly with years of data "
        "accumulated. At n ≥ 3 years (≥ 6 sessions per season), within-season baselines "
        "become reliable."
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # 4. DISTURBANCE DETECTION
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("4  Disturbance Detection")

    story += h3_block("Approach")
    story.append(p(
        "SCOUT flags individual recordings as disturbance events when anthropogenic "
        "noise suppresses biological indices below their session-normal range. The two "
        "primary indicators are:"
    ))
    story.append(b(
        "<b>NDSI:</b> drops sharply when low-frequency anthropogenic energy (vessel "
        "engines, outboard motors) enters the 0–1 kHz band, displacing biological "
        "sources in the NDSI ratio."
    ))
    story.append(b(
        "<b>BI:</b> drops simultaneously because biological 1–8 kHz energy is partially "
        "masked or organisms cease vocalizing in response to the noise."
    ))

    story += h3_block("Z-Score Detection")
    story.append(eq(
        "z<sub>NDSI,i</sub> = (NDSI<sub>i</sub> − NDSĪ) / σ<sub>NDSI</sub>"
        "        "
        "z<sub>BI,i</sub> = (BI<sub>i</sub> − B̄I) / σ<sub>BI</sub>"
    ))
    story.append(p(
        "A recording is flagged as a disturbance event when either z-score falls "
        "below the detection threshold:"
    ))
    story.append(eq(
        "disturbance<sub>i</sub>  =  (z<sub>NDSI,i</sub> &lt; −2.0)  OR  (z<sub>BI,i</sub> &lt; −2.0)"
    ))

    story += h3_block("Threshold Rationale (−2.0σ)")
    story.append(p(
        "Under a normal distribution, −2.0σ corresponds to approximately 2.3% of "
        "observations. With 20 recordings per session, this gives an expected "
        "false-positive rate of <b>0.46 recordings per session</b> on clean data. "
        "The previous threshold of −1.5σ (~6.7% per index, OR logic) produced "
        "2–3 false flags per session, rendering the disturbance flag too noisy to "
        "be actionable."
    ))
    story.append(p(
        "The −2.0σ threshold is consistent with standard practice for acoustic "
        "anomaly detection in passive monitoring systems (Merchant et al., 2015)."
    ))

    story += h3_block("Disturbance Score")
    story.append(p(
        "Each recording receives a continuous disturbance_score ∈ [0, 1] reflecting "
        "the combined strength of both signals:"
    ))
    story.append(eq(
        "score<sub>i</sub>  =  0.6 × clip(−z<sub>NDSI,i</sub> / 2.0, 0, 1)"
        "  +  0.4 × clip(−z<sub>BI,i</sub> / 2.0, 0, 1)"
    ))
    story.append(p(
        "<b>Weighting rationale (0.6 / 0.4):</b> NDSI captures both the drop in "
        "biological energy and the rise in anthropogenic energy simultaneously, making "
        "it a more complete disturbance signature. BI provides secondary confirmation. "
        "A score of 1.0 corresponds to both indices simultaneously reaching −2.0σ — "
        "a strong, unambiguous disturbance event."
    ))
    story.append(ref(
        "[Merchant et al., 2015] — \"Measuring acoustic habitats\" — "
        "<i>Methods in Ecology and Evolution</i>, 6(3):257–265"
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # 5. REEF HEALTH CLASSIFICATION
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("5  Reef Health Classification")
    story.append(p(
        "SCOUT classifies reef health at two temporal scales."
    ))

    story += h3_block("Per-Recording Classification (Within Session)")
    story.append(p(
        "Within a single recording session, each recording receives a composite "
        "health_score ∈ [0, 1]:"
    ))
    story.append(eq(
        "health_score  =  ∑<sub>j</sub>  w<sub>j</sub> · x̂<sub>j</sub>"
    ))
    story.append(p(
        "where x̂<sub>j</sub> is the min-max normalized value of index j across the "
        "session. Index weights:"
    ))
    weight_data = [
        ["Index", "Weight", "Justification"],
        ["ACI",   "0.30",   "Strongest proxy for biological diversity"],
        ["BI",    "0.25",   "Direct measure of biological energy"],
        ["NDSI",  "0.20",   "Anthropogenic pressure indicator"],
        ["H",     "0.15",   "Overall soundscape complexity"],
        ["ADI",   "0.10",   "Frequency niche diversity"],
    ]
    story.append(section_table(weight_data, [0.8*inch, 0.8*inch, 4.6*inch]))
    story.append(sp(8))

    story.append(p("Recordings are classified relative to the session median:"))
    label_data = [
        ["Condition", "Label"],
        ["score ≥ median + 0.5σ", "improving"],
        ["score ≤ median − 0.5σ", "declining"],
        ["otherwise",              "stagnant"],
    ]
    story.append(section_table(label_data, [2.8*inch, 3.4*inch]))
    story.append(sp(8))
    story.append(callout_box(
        "<b>Important:</b> these labels are <b>session-local comparisons only</b>. "
        "Min-max normalization is recomputed for each session independently. "
        "health_score and health_label must not be compared across sessions."
    ))
    story.append(sp(8))

    story += h3_block("Multi-Session Trend Classification (Longitudinal)")
    story.append(p(
        "Across sessions, SCOUT derives a single reef trajectory label by running "
        "Mann-Kendall on each of the three primary indices and aggregating the results."
    ))
    story.append(p(
        "<b>Voting scheme:</b> Each of ACI, BI, and NDSI contributes a weighted vote "
        "proportional to its effect size |τ|:"
    ))
    story.append(b("Significant trend (p &lt; 0.05): vote = sign(τ) × |τ|"))
    story.append(b("Marginal trend (0.05 ≤ p &lt; 0.10): vote = sign(τ) × |τ| × 0.5"))
    story.append(b("No trend (p ≥ 0.10): vote = 0"))
    story.append(sp(6))

    vote_data = [
        ["Score",    "Label"],
        ["≤ −0.67",  "declining"],
        ["≥ +0.67",  "improving"],
        ["otherwise","stagnant"],
    ]
    story.append(section_table(vote_data, [1.5*inch, 4.7*inch]))
    story.append(sp(8))
    story.append(p(
        "The threshold 0.67 requires either two significant declining indices with "
        "moderate effect sizes or one strong (|τ| ≥ 0.67) significant index paired "
        "with a marginal confirming signal. Both raw-index and seasonally z-scored "
        "results are computed. The seasonally corrected result is the recommended "
        "primary output when ≥ 2 full years of data are available."
    ))

    # ═══════════════════════════════════════════════════════════════════════
    # 6. DATA SOURCES
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("6  Data Sources")

    story += h3_block("Sesoko Island Acoustic Dataset")
    story.append(p(
        "All baseline analyses use passive acoustic recordings from "
        "<b>Sesoko Island, Okinawa, Japan</b> (~26°38'N, 127°52'E), a subtropical "
        "coral reef system in the East China Sea."
    ))
    params_data = [
        ["Parameter", "Value"],
        ["Site",               "Site A"],
        ["Depth",              "1.5 m"],
        ["Recording window",   "00:00 – 00:20 local time (midnight)"],
        ["Files per session",  "5 × 5-minute recordings"],
        ["Sessions",           "8 (Aug 2017 – Jul 2018)"],
        ["Sample rate",        "22,050 Hz (resampled from native)"],
        ["Filename format",    "SSK_Site_A_YYYYMMDD_HHMMSS.wav"],
    ]
    story.append(section_table(params_data, [2.0*inch, 4.2*inch]))
    story.append(sp(8))
    story.append(callout_box(
        "<b>Why midnight recordings?</b> Earlier sessions (Jun–Jul 2017) recorded only "
        "at dusk. Using midnight gives a consistent time-of-day baseline across all "
        "8 sessions, avoiding confounds from diel variation in reef acoustic activity."
    ))
    story.append(sp(8))

    story += h3_block("Soundscape Ecology Framework References")
    for r in [
        "[Pijanowski et al., 2011] — \"Soundscape Ecology: The Science of Sound in the Landscape\" — <i>BioScience</i>, 61(3):203–216",
        "[Staaterman et al., 2014] — \"Celestial patterns in marine soundscapes\" — <i>Marine Ecology Progress Series</i>, 508:17–32",
        "[Kennedy et al., 2010] — \"Acoustic monitoring of habitat disturbance and recovery in coral reefs\" — <i>Proc. Royal Society B</i>, 277:969–977",
    ]:
        story.append(ref(r))

    # ═══════════════════════════════════════════════════════════════════════
    # 7. LIMITATIONS
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("7  Limitations")

    lims = [
        (
            "1. Single Year of Baseline Data",
            [
                "<b>Statistical power:</b> Mann-Kendall requires |τ| ≥ 0.64 for "
                "p &lt; 0.05 at n = 8. Real moderate declines may not reach statistical "
                "significance. Absence of a significant trend is not evidence of reef "
                "stability; it reflects data scarcity.",
                "<b>Seasonal baselines are approximate:</b> with 2–3 sessions per season, "
                "each observation contributes substantially to the baseline used to "
                "normalize it.",
                "<b>No inter-annual comparison:</b> the current dataset cannot distinguish "
                "a seasonal pattern from a genuine multi-year trend. Reliable monotonic "
                "decline detection requires at least 2–3 years of monthly recordings.",
            ]
        ),
        (
            "2. Single Depth and Site",
            [
                "<b>Surface bias:</b> 1.5 m recordings are dominated by the snapping shrimp "
                "layer and surface-water fish communities. Deeper reef communities are not "
                "represented.",
                "<b>No spatial replication:</b> indices reflect local conditions at one point "
                "on the reef. Spatial heterogeneity (patchy bleaching, localized damage) "
                "will not be captured.",
            ]
        ),
        (
            "3. No Ground Truth Validation",
            [
                "Index weights (ACI 0.30, BI 0.25, etc.) are based on literature review "
                "and expert judgement, not site-specific calibration.",
                "The health_label thresholds (±0.5σ from median) are heuristic.",
                "Disturbance detection has not been validated against annotated ground-truth "
                "boat passages or noise events.",
            ]
        ),
        (
            "4. Index Correlation",
            [
                "ACI, BI, and NDSI are positively correlated — all three increase with "
                "biological activity. The three 'votes' in the longitudinal classifier are "
                "not fully independent. A single underlying change (e.g., snapping shrimp "
                "crash) will simultaneously move all three indices, which may make the "
                "consensus classifier appear more robust than it actually is.",
            ]
        ),
        (
            "5. Recording Condition Sensitivity",
            [
                "All indices are sensitive to recording gain, hydrophone placement, and "
                "instrument noise. The pipeline assumes consistent recording conditions "
                "across sessions. Variation in hydrophone depth or recorder gain between "
                "deployments could introduce artificial trends unrelated to reef health.",
            ]
        ),
    ]

    for title, bullets in lims:
        story += h3_block(title)
        for btext in bullets:
            story.append(b(btext))
        story.append(sp(4))

    # ═══════════════════════════════════════════════════════════════════════
    # 8. SOFTWARE DEPENDENCIES
    # ═══════════════════════════════════════════════════════════════════════
    story += h2_block("8  Software Dependencies")

    deps_data = [
        ["Library",         "Purpose",                          "Reference"],
        ["scikit-maad",     "Acoustic index computation",       "Ulloa et al., 2021"],
        ["pymannkendall",   "Modified Mann-Kendall tests",      "Hussain &amp; Mahmud, 2019"],
        ["scipy",           "Signal processing, spectrograms",  "Virtanen et al., 2020"],
        ["numpy",           "Numerical computation",            "Harris et al., 2020"],
        ["pandas",          "Tabular data management",          "McKinney, 2010"],
        ["matplotlib",      "Visualization",                    "Hunter, 2007"],
    ]
    story.append(section_table(deps_data, [1.4*inch, 2.5*inch, 2.3*inch]))
    story.append(sp(16))

    # ── Footer note ──────────────────────────────────────────────────────────
    story.append(hr())
    story.append(p(
        "<i>Last updated: 2026-06-03. SCOUT is under active development. "
        "Methodology is subject to revision as additional data are collected and "
        "validation analyses are completed.</i>",
        "callout"
    ))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF written to {OUTPUT}")


# ── helpers ──────────────────────────────────────────────────────────────────

def h2_block(text):
    return [hr(), Paragraph(text, ST["h2"])]

def h3_block(text):
    return [Paragraph(text, ST["h3"])]

def h4_block(text):
    return [Paragraph(text, ST["h4"])]


if __name__ == "__main__":
    build()
