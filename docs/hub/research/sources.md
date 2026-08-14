# Source Registry

> **Summary** — The canonical bibliography for SCOUT: every external work cited anywhere in the
> project, listed once, with DOI, access status, where the PDF lives, and what we took from it.
> This page is the answer to *"have we already researched X?"* and *"what backs this claim?"*
>
> Part of the [Knowledge Hub](README.md). Reading notes for key papers live in
> [`notes/`](notes/); the PDFs live in [`library/`](library/) (open-access) or the private
> `library-restricted/` submodule (copyrighted). Open research questions are in
> [`open-questions.md`](open-questions.md).

---

## Access & storage legend

| Mark | Meaning | Where the PDF goes |
|---|---|---|
| 🔓 | Open access / permissive license — safe to redistribute | [`library/`](library/) (committed, public) |
| 🔒 | Copyrighted / paywalled — **do not commit to the public repo** | `library-restricted/` (private submodule) |
| ❓ | Access not yet verified | Confirm before placing a file |

Every row is public metadata regardless of access — only the PDF placement differs. When you add
a PDF, name it `<key>.pdf` (e.g. `duarte-2021.pdf`) and fill the **Local** column.

---

## Acoustic indices (ACI, BI, NDSI, H, ADI)

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `pieretti-2011` | Pieretti et al. (2011). "A new methodology to infer the singing activity of an avian community: The Acoustic Complexity Index (ACI)." *Ecological Indicators* 11(3):868–873. [doi](https://doi.org/10.1016/j.ecolind.2010.11.005) | 🔒 | — | ACI definition — [methodology](../analysis/coral-bioacoustic-methodology.md) |
| `boelman-2007` | Boelman et al. (2007). "Multi-trophic invasion resistance in Hawaii: bioacoustics, field surveys, and airborne remote sensing." *Ecological Applications* 17(8):2137–2144. [doi](https://doi.org/10.1890/07-0004.1) | 🔒 | — | Bioacoustic Index (BI) basis |
| `kasten-2012` | Kasten et al. (2012). "The REAL acoustic library: an archive for studying soundscape ecology." *Ecological Informatics* 12:50–67. [doi](https://doi.org/10.1016/j.ecoinf.2012.01.003) | 🔒 | — | NDSI origin |
| `sueur-2008` | Sueur et al. (2008). "Rapid acoustic survey for biodiversity appraisal." *PLOS ONE* 3(12):e4065. [doi](https://doi.org/10.1371/journal.pone.0004065) | 🔓 | — | Acoustic entropy (H) index |
| `villanueva-rivera-2011` | Villanueva-Rivera et al. (2011). "A primer of acoustic analysis for landscape ecologists." *Landscape Ecology* 26(9):1233–1246. [doi](https://doi.org/10.1007/s10980-011-9636-9) | 🔒 | — | Acoustic Diversity Index (ADI) |
| `bradfer-lawrence-2019` | Bradfer-Lawrence et al. (2019). "Guidelines for the use of acoustic indices in environmental research." *Methods in Ecology and Evolution* 10(10):1796–1807. [doi](https://doi.org/10.1111/2041-210X.13254) | 🔒 | — | Why indices co-vary (the "shrimp counter" problem) → PCA over weighted composite |
| `bohnenstiehl-2018` | Bohnenstiehl et al. (2018). "Investigating the utility of ecoacoustic metrics in marine soundscapes." *Journal of Ecoacoustics* 2:R1156L. [doi](https://doi.org/10.22261/JEA.R1156L) | 🔓 | — | Index redundancy in marine soundscapes |

## Soundscape ecology & reef acoustics

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `duarte-2021` | Duarte et al. (2021). "The soundscape of the Anthropocene ocean." *Science* 371(6529):eaba4658. [doi](https://doi.org/10.1126/science.aba4658) | 🔒 | — | **Three-zone spectrum model**; 0–200 Hz anthropogenic band — [notes](notes/) |
| `mcwilliam-2018` | McWilliam et al. (2018). "Limitations of passive acoustic monitoring for detecting sublethal effects of noise on fish behaviour." *Marine Pollution Bulletin* 136:405–413. [doi](https://doi.org/10.1016/j.marpolbul.2018.09.041) | 🔒 | — | Reef fish vocal range overlaps anthropogenic band |
| `tricas-boyle-2014` | Tricas & Boyle (2014). Reef fish sound production and hearing (Marine Ecology Progress Series). ❓ DOI to confirm | ❓ | — | Reef fish call primarily 100–800 Hz — motivates the mixed band |
| `pijanowski-2011` | Pijanowski et al. (2011). "Soundscape ecology: the science of sound in the landscape." *BioScience* 61(3):203–216. [doi](https://doi.org/10.1525/bio.2011.61.3.6) | 🔒 | — | Foundational soundscape ecology framing |
| `staaterman-2014` | Staaterman et al. (2014). "Celestial patterns in marine soundscapes." *Marine Ecology Progress Series* 508:17–32. [doi](https://doi.org/10.3354/meps10911) | 🔒 | — | Diel/seasonal chorus patterns → Chorus Ratio (future index) |
| `kennedy-2010` | Kennedy et al. (2010). "Acoustic monitoring of habitat disturbance and recovery in coral reefs." *Proc. R. Soc. B* 277:969–977. [doi](https://doi.org/10.1098/rspb.2009.1969) | 🔒 | — | Acoustic detection of reef disturbance/recovery |
| `merchant-2015` | Merchant et al. (2015). "Measuring acoustic habitats." *Methods in Ecology and Evolution* 6(3):257–265. [doi](https://doi.org/10.1111/2041-210X.12330) | 🔒 | — | −2.0σ anomaly threshold basis |
| `lin-2021` | Lin, Akamatsu, Sinniger & Harii (2021). "Exploring coral reef biodiversity via underwater soundscapes." *Biological Conservation* 253:108901. [doi](https://doi.org/10.1016/j.biocon.2020.108901) | 🔒 | — | **Validation dataset paper** (Sesoko Island) — [methodology §data-sources](../analysis/coral-bioacoustic-methodology.md#data-sources) |

## Trend detection & statistics

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `sen-1968` | Sen (1968). "Estimates of the regression coefficient based on Kendall's tau." *JASA* 63(324):1379–1389. [doi](https://doi.org/10.1080/01621459.1968.10480934) | 🔒 | — | Sen's slope estimator |
| `hamed-rao-1998` | Hamed & Rao (1998). "A modified Mann-Kendall trend test for autocorrelated data." *J. Hydrology* 204(1–4):182–196. [doi](https://doi.org/10.1016/S0022-1694(97)00125-X) | 🔒 | — | **Trend test used** for multi-month detection |
| `hussain-mahmud-2019` | Hussain & Mahmud (2019). "pyMannKendall: a Python package for non-parametric Mann-Kendall trend tests." *JOSS* 4(39):1556. [doi](https://doi.org/10.21105/joss.01556) | 🔓 | — | The library implementing the trend test |

## Tooling / software cited

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `ulloa-2021` | Ulloa et al. (2021). "scikit-maad: … quantitative analysis of eco-acoustic … " *Methods in Ecology and Evolution*. [doi](https://doi.org/10.1111/2041-210X.13711) | ❓ | — | Acoustic index computation library |
| `virtanen-2020` | Virtanen et al. (2020). "SciPy 1.0." *Nature Methods* 17:261–272. [doi](https://doi.org/10.1038/s41592-019-0686-2) | 🔓 | — | Signal processing, spectrograms |
| `harris-2020` | Harris et al. (2020). "Array programming with NumPy." *Nature* 585:357–362. [doi](https://doi.org/10.1038/s41586-020-2649-2) | 🔓 | — | Numerical computation |

## Communications protocol

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `shaghaghi-2020` | Shaghaghi et al. (2020). ÂB / EACP — energy-aware comm protocol (sleep-wake synchronization). ❓ venue/DOI to confirm | ❓ | — | **The comms protocol SCOUT is adapting.** By advisor Navid Shaghaghi — obtain directly. Assigned reading in [Team Timeline](../planning/team-timeline.md) — [notes](notes/shaghaghi-2020-eacp.md) |

---

## Maintenance

- **Adding a source:** add a row to the right topic table, fill DOI + access, and — if you have
  the PDF — drop it in `library/` (🔓) or `library-restricted/` (🔒) named `<key>.pdf` and fill
  **Local**. If it's worth a paragraph, add a note in [`notes/`](notes/).
- **Access ❓ rows** need their license confirmed before any PDF is committed. When in doubt,
  leave the file out of the public repo and keep the DOI link.
- Strip tracking parameters (`?utm_source=…`) from every URL per
  [CONVENTIONS.md → Citing sources](../CONVENTIONS.md#citing-sources).
