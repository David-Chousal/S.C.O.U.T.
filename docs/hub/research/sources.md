# Source Registry

> **Summary** — The canonical bibliography for S.C.O.U.T.: every external work cited anywhere in the
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
| `sueur-2008` | Sueur et al. (2008). "Rapid acoustic survey for biodiversity appraisal." *PLOS ONE* 3(12):e4065. [doi](https://doi.org/10.1371/journal.pone.0004065) | 🔓 | library/sueur-2008.pdf | Acoustic entropy (H) index |
| `villanueva-rivera-2011` | Villanueva-Rivera et al. (2011). "A primer of acoustic analysis for landscape ecologists." *Landscape Ecology* 26(9):1233–1246. [doi](https://doi.org/10.1007/s10980-011-9636-9) | 🔒 | — | Acoustic Diversity Index (ADI) |
| `bradfer-lawrence-2019` | Bradfer-Lawrence et al. (2019). "Guidelines for the use of acoustic indices in environmental research." *Methods in Ecology and Evolution* 10(10):1796–1807. [doi](https://doi.org/10.1111/2041-210X.13254) | 🔒 | — | Why indices co-vary (the "shrimp counter" problem) → PCA over weighted composite |
| `bohnenstiehl-2018` | Bohnenstiehl et al. (2018). "Investigating the utility of ecoacoustic metrics in marine soundscapes." *Journal of Ecoacoustics* 2:R1156L. [doi](https://doi.org/10.22261/JEA.R1156L) | 🔓 | library/bohnenstiehl-2018.pdf | Index redundancy in marine soundscapes |

## Soundscape ecology & reef acoustics

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `duarte-2021` | Duarte et al. (2021). "The soundscape of the Anthropocene ocean." *Science* 371(6529):eaba4658. [doi](https://doi.org/10.1126/science.aba4658) | 🔒 | — | **Three-zone spectrum model**; 0–200 Hz anthropogenic band — [notes](notes/duarte-2021.md) |
| `mcwilliam-2018` | McWilliam et al. (2018). "Limitations of passive acoustic monitoring for detecting sublethal effects of noise on fish behaviour." *Marine Pollution Bulletin* 136:405–413. [doi](https://doi.org/10.1016/j.marpolbul.2018.09.041) | 🔒 | — | Reef fish vocal range overlaps anthropogenic band |
| `tricas-boyle-2014` | Tricas & Boyle (2014). Reef fish sound production and hearing (Marine Ecology Progress Series). ❓ DOI to confirm | ❓ | — | Reef fish call primarily 100–800 Hz — motivates the mixed band |
| `pijanowski-2011` | Pijanowski et al. (2011). "Soundscape ecology: the science of sound in the landscape." *BioScience* 61(3):203–216. [doi](https://doi.org/10.1525/bio.2011.61.3.6) | 🔒 | — | Foundational soundscape ecology framing |
| `staaterman-2014` | Staaterman et al. (2014). "Celestial patterns in marine soundscapes." *Marine Ecology Progress Series* 508:17–32. [doi](https://doi.org/10.3354/meps10911) | 🔒 | — | Diel/seasonal chorus patterns → Chorus Ratio (future index) |
| `kennedy-2010` | Kennedy et al. (2010). "Acoustic monitoring of habitat disturbance and recovery in coral reefs." *Proc. R. Soc. B* 277:969–977. [doi](https://doi.org/10.1098/rspb.2009.1969) | 🔒 | — | Acoustic detection of reef disturbance/recovery |
| `merchant-2015` | Merchant et al. (2015). "Measuring acoustic habitats." *Methods in Ecology and Evolution* 6(3):257–265. [doi](https://doi.org/10.1111/2041-210X.12330) | 🔒 | — | −2.0σ anomaly threshold basis |
| `lin-2021` | Lin, Akamatsu, Sinniger & Harii (2021). "Exploring coral reef biodiversity via underwater soundscapes." *Biological Conservation* 253:108901. [doi](https://doi.org/10.1016/j.biocon.2020.108901) | 🔒 | — | **Validation dataset paper** (Sesoko Island) — [methodology §data-sources](../analysis/coral-bioacoustic-methodology.md#data-sources) |

## Thermal stress & coral bleaching (DHW)

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `liu-2014` | Liu et al. (2014). "Reef-scale thermal stress monitoring of coral ecosystems: new 5-km global products from NOAA Coral Reef Watch." *Remote Sensing* 6(11):11579–11606. [doi](https://doi.org/10.3390/rs61111579) | 🔓 | library/liu-2014.pdf | Defines HotSpot / **DHW** and the 4/8/12 °C-week bleaching bands — the algorithm telemetry `bleaching.py` implements — [notes](notes/liu-2014-dhw.md) |
| `skirving-2020` | Skirving et al. (2020). "CoralTemp and the Coral Reef Watch coral bleaching heat stress product suite v3.1." *Remote Sensing* 12(23):3856. [doi](https://doi.org/10.3390/rs12233856) | 🔓 | library/skirving-2020.pdf | Defines the **MMM** climatology (`--mmm` in `run_telemetry.py`) DHW is measured against — [notes](notes/skirving-2020-coraltemp-mmm.md) |
| `kayanne-2017` | Kayanne (2017). "Validation of degree heating weeks as a coral bleaching index." *Coral Reefs* 36:63–70. [doi](https://doi.org/10.1007/s00338-016-1524-y) | 🔒 | — | **Empirical validation:** DHW > 8 °C-weeks matches observed bleaching → justifies the alert bands — [notes](notes/kayanne-2017-dhw-validation.md) |
| `hobday-2016` | Hobday et al. (2016). "A hierarchical approach to defining marine heatwaves." *Progress in Oceanography* 141:227–238. [doi](https://doi.org/10.1016/j.pocean.2015.12.014) | 🔒 | — | Standard **marine-heatwave** definition/vocabulary for interpreting S.C.O.U.T. temperature events |

## In-situ temperature reference data

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `noaa-ncrmp-str` | NOAA NCRMP Subsurface Temperature Recorder (STR) network, U.S. Pacific reefs (Sea-Bird loggers, ~5/15/25 m, 2005–2024). NOAA NCEI. [doi](https://doi.org/10.7289/v5ks6pv2) | 🔓 | — | **Ground-truth comparator** for S.C.O.U.T. in-situ temperature + DHW (Hawaii subset overlaps deployment); sets the accuracy bar for the DS18B20 — [notes](notes/noaa-ncrmp-str-2018-dataset.md) |
| `margaritis-2025` | Margaritis et al. (2025). "Intercomparison of satellite and in-situ sea-surface temperature on Caribbean reefs." *PLOS Climate* 4:e0000480. [doi](https://doi.org/10.1371/journal.pclm.0000480) | 🔓 | library/margaritis-2025.pdf | CoralTemp overstates nearshore warming (~0.20 °C/decade) → **strongest external warrant** for in-situ ground truth — [notes](notes/margaritis-2025-sst-intercomparison.md) |

## Turbidity, sedimentation & water quality

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `fabricius-2005` | Fabricius (2005). "Effects of terrestrial runoff on the ecology of corals and coral reefs: review and synthesis." *Marine Pollution Bulletin* 50(2):125–146. [doi](https://doi.org/10.1016/j.marpolbul.2004.11.028) | 🔒 | — | Scientific warrant for turbidity as a first-class reef-health signal — [notes](notes/fabricius-2005-runoff.md) |
| `sully-2020` | Sully & van Woesik (2020). "Turbid reefs moderate coral bleaching under climate-related thermal stress." *Global Change Biology* 26(3):1367–1373. [doi](https://doi.org/10.1111/gcb.14948) | 🔒 | — | Temp × turbidity interaction has a **sign** → stress score must not be additive — [notes](notes/sully-2020-turbid-refugia.md) |
| `droujko-2022` | Droujko & Molnar (2022). "Open-source, low-cost, in-situ turbidity sensor for river network monitoring." *Scientific Reports* 12:10341. [doi](https://doi.org/10.1038/s41598-022-14228-4) | 🔓 | library/droujko-2022.pdf | Formazin calibration recipe + the particle-directionality caveat for the SEN0189 NTU path — [notes](notes/droujko-2022-turbidity-sensor.md) |
| `sen0189-datasheet` | DFRobot. *Turbidity sensor SKU: SEN0189* — product datasheet. [PDF](https://media.digikey.com/pdf/data%20sheets/dfrobot%20pdfs/sen0189_web.pdf) · [wiki](https://wiki.dfrobot.com/Turbidity_sensor_SKU__SEN0189) | 🔓 | — | Manufacturer statement settling the ADC polarity: *"the output value will decrease when in liquids with a high turbidity"*. Basis for [Data Schema → Turbidity polarity](../../engineering/data-schema.md) and the `facts.md` polarity row |

## Trend detection & statistics

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `sen-1968` | Sen (1968). "Estimates of the regression coefficient based on Kendall's tau." *JASA* 63(324):1379–1389. [doi](https://doi.org/10.1080/01621459.1968.10480934) | 🔒 | — | Sen's slope estimator |
| `hamed-rao-1998` | Hamed & Rao (1998). "A modified Mann-Kendall trend test for autocorrelated data." *J. Hydrology* 204(1–4):182–196. [doi](https://doi.org/10.1016/S0022-1694(97)00125-X) | 🔒 | — | **Trend test used** for multi-month detection |
| `hussain-mahmud-2019` | Hussain & Mahmud (2019). "pyMannKendall: a Python package for non-parametric Mann-Kendall trend tests." *JOSS* 4(39):1556. [doi](https://doi.org/10.21105/joss.01556) | 🔓 | library/hussain-mahmud-2019.pdf | The library implementing the trend test |

## Tooling / software cited

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `ulloa-2021` | Ulloa et al. (2021). "scikit-maad: … quantitative analysis of eco-acoustic … " *Methods in Ecology and Evolution*. [doi](https://doi.org/10.1111/2041-210X.13711) | ❓ | — | Acoustic index computation library |
| `virtanen-2020` | Virtanen et al. (2020). "SciPy 1.0." *Nature Methods* 17:261–272. [doi](https://doi.org/10.1038/s41592-019-0686-2) | 🔓 | library/virtanen-2020.pdf | Signal processing, spectrograms |
| `harris-2020` | Harris et al. (2020). "Array programming with NumPy." *Nature* 585:357–362. [doi](https://doi.org/10.1038/s41586-020-2649-2) | 🔓 | library/harris-2020.pdf | Numerical computation |

## Communications protocol

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `shaghaghi-2020` | Shaghaghi et al. (2020). ÂB / EACP — energy-aware comm protocol (sleep-wake synchronization). ❓ venue/DOI to confirm | ❓ | — | **The comms protocol S.C.O.U.T. is adapting.** By advisor Navid Shaghaghi — obtain directly. Assigned reading in [Team Timeline](../planning/team-timeline.md) — [notes](notes/shaghaghi-2020-eacp.md) |

## LoRa / LPWAN over seawater

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `jovalekic-2018` | Jovalekić et al. (2018). "Experimental study of LoRa transmission over seawater." *Sensors* 18(9):2853. [doi](https://doi.org/10.3390/s18092853) | 🔓 | library/jovalekic-2018.pdf | **Upper bound:** clear-LOS LoRa feasible to ~22 km over seawater (868/434 MHz); sea surface not the limiter — [notes](notes/jovalekic-2018-lora-seawater.md) |
| `gutierrez-gomez-2021` | Gutiérrez-Gómez et al. (2021). "Analysis of LoRa P2P near-surface links over water." *Sensors* 21(20):6872. [doi](https://doi.org/10.3390/s21206872) | 🔓 | library/gutierrez-gomez-2021.pdf | **Lower bound:** near-surface antenna height dominates path loss — the buoy's real constraint — [notes](notes/gutierrez-gomez-2021-lora-near-surface.md) |
| `parri-2019` | Parri et al. (2019). "Offshore LoRaWAN networking: … buoy-height antennas at sea." *Sensors* 19(14):3239. [doi](https://doi.org/10.3390/s19143239) | 🔓 | library/parri-2019.pdf | **Closest analog:** LoRaWAN measured at 2.1 m / 3.5 m buoy-height antennas offshore — the Phase 4 prior — [notes](notes/parri-2019-lpwan-at-sea.md) |
| `adelantado-2017` | Adelantado et al. (2017). "Understanding the limits of LoRaWAN." *IEEE Communications Magazine* 55(9):34–40. [doi](https://doi.org/10.1109/MCOM.2017.1600613) · preprint [arXiv:1607.08011](https://arxiv.org/abs/1607.08011) | 🔒 (preprint 🔓) | library/adelantado-2017.pdf | Duty-cycle / airtime / SF trade — the theory under the 1×/day 82-byte packet — [notes](notes/adelantado-2017-lorawan-limits.md) |
| `bouguera-2018` | Bouguera et al. (2018). "Energy consumption model for sensor nodes based on LoRa and LoRaWAN." *Sensors* 18(7):2104. [doi](https://doi.org/10.3390/s18072104) | 🔓 | library/bouguera-2018.pdf | Energy-per-packet model (SF × power × payload) → feeds the open battery/solar sizing — [notes](notes/bouguera-2018-lora-energy.md) |

## Link reliability & FEC

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `ali-2024` | Ali et al. (2024). "Error mitigation in LPWAN systems: a study on the efficacy of Hamming-coded RPW." *PLOS ONE* 19(6):e0304386. [doi](https://doi.org/10.1371/journal.pone.0304386) | 🔓 | library/ali-2024.pdf | **PHY FEC dial:** Hamming coding (LoRa's CR 4/5–4/8) buys several dB of margin — near-free at 1×/day — [notes](notes/ali-2024-lpwan-hamming-fec.md) |
| `carvalho-2021` | Fernandes Carvalho, Ferrari, Flammini & Sisinni (2021). "Improving redundancy in LoRaWAN for mixed-criticality scenarios." *IEEE Systems Journal* 15(3):3682–3691. [doi](https://doi.org/10.1109/JSYST.2020.3015274) | 🔒 | — | **App-layer redundancy:** repeating a sporadic packet cut failure prob. from >78% to 2.5% — the lever for the daily packet — [notes](notes/carvalho-2021-lora-redundancy.md) |

## Data quality & sensor integrity

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `manov-2004` | Manov, Chang & Dickey (2004). "Methods for reducing biofouling of moored optical sensors." *Journal of Atmospheric and Oceanic Technology* 21(6):958–968. [doi](https://doi.org/10.1175/1520-0426(2004)021%3C0958:MFRBOM%3E2.0.CO;2) | 🔒 | — | Optical-sensor **fouling drift is monotonic** → mimics a turbidity trend in `turbidity.py`; detect by cross-comparison — [notes](notes/manov-2004-biofouling-optical-drift.md) |
| `qartod-optics-2017` | U.S. IOOS (2017). "Manual for real-time quality control of ocean optics data, v1.1." 49 pp. [doi](https://doi.org/10.25923/v9p8-ft24) | 🔓 | library/qartod-optics-2017.pdf | QC **flag standard** (flat-line / rate-of-change catch a fouled sensor) for turbidity — implement in `qc.py` — [notes](notes/qartod-optics-2017-qc.md) |

## Biofouling mitigation products

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `rustoleum-marine-antifouling` | Rust-Oleum. *Marine Boat Bottom Antifouling Paint* — product page. [Home Depot](https://www.homedepot.com/p/Rust-Oleum-Marine-1-qt-Flat-Blue-Boat-Bottom-Antifouling-Paint-396968/100184819) | 🔓 | — | Copper-based candidate, cheapest and only general-retailer option — [Biofouling Antifouling Coatings](../../research/biofouling-antifouling-coatings.md), [SCO-15](https://linear.app/scout1/issue/SCO-15) |
| `totalboat-krypton` | TotalBoat. *Krypton Copper-Free Antifouling Bottom Paint* — product page. [totalboat.com](https://www.totalboat.com/products/krypton-antifouling-bottom-paint) | 🔓 | — | Copper-free candidate (zinc pyrithione + tralopyril) — [Biofouling Antifouling Coatings](../../research/biofouling-antifouling-coatings.md) |
| `seahawk-smart-solution` | Sea Hawk Paints. *Smart Solution Antifouling Paint* — product page. [West Marine](https://www.westmarine.com/sea-hawk-smart-solution-antifouling-paint-P018194134.html) | 🔓 | — | Copper-free (Econea) candidate, smallest available quantity (pint) — [Biofouling Antifouling Coatings](../../research/biofouling-antifouling-coatings.md) |

---

## Structural / hydrodynamic loads (FEA)

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `usace-cem` | U.S. Army Corps of Engineers. *Coastal Engineering Manual*, EM 1110-2-1100. [USACE publication](https://www.publications.usace.army.mil/USACE-Publications/Engineer-Manuals/) | 🔓 | — | Buoyancy/statics, linear wave theory, and breaking-wave criteria basis — [Buoy Structural Load Framework](../../engineering/buoy-structural/structural-load-framework.md) |
| `dnv-rp-c205` | DNV. *Recommended Practice DNV-RP-C205: Environmental Conditions and Environmental Loads.* [dnv.com](https://www.dnv.com/energy/standards-guidelines/dnv-rp-c205-environmental-conditions-and-environmental-loads/) | 🔓 | — | Morison equation `C_D`/`C_M` vs. Keulegan–Carpenter number — [Buoy Structural Load Framework §3.1](../../engineering/buoy-structural/structural-load-framework.md#31-correction--how-to-actually-select-c_d-and-c_m-c_a-in-5) |
| `sharqawy-2010` | Sharqawy, Lienhard & Zubair (2010). "Thermophysical properties of seawater: a review of existing correlations and data." *Desalination and Water Treatment* 16(1–3):354–380. [doi](https://doi.org/10.5004/dwt.2010.1079) | 🔓 | — | Seawater kinematic viscosity for the Reynolds-number lookup — exact table value not yet pulled, order-of-magnitude only — [Buoy Structural Load Framework §3.1](../../engineering/buoy-structural/structural-load-framework.md#31-correction--how-to-actually-select-c_d-and-c_m-c_a-in-5) |
| `wave-theory-selection` | "A guide for selecting periodic water wave theories — Le Méhauté (1976)'s graph revisited." *Coastal Engineering*. ❓ DOI to confirm | ❓ | — | Ursell-number wave-theory validity regions / breaking check — [Buoy Structural Load Framework §4.1](../../engineering/buoy-structural/structural-load-framework.md#41-correction--check-the-design-wave-against-linear-theorys-validity-limits-before-trusting-these) |
| `faltinsen-1990` | Faltinsen, O.M. (1990). *Sea Loads on Ships and Offshore Structures.* Cambridge University Press. No DOI (book) | 🔒 | — | Catenary mooring-line statics derivation — [Buoy Structural Load Framework §8.2](../../engineering/buoy-structural/structural-load-framework.md#82-lc-a--slack-mooring-calm-water-baseline-catenary-the-physically-correct-resting-state) |
| `thenavalarch-catenary` | TheNavalArch. "Understanding how buoys affect the catenary of a mooring line" — technical article. [thenavalarch.com](https://thenavalarch.com/understanding-how-buoys-affect-the-catenary-of-a-mooring-line/) | 🔓 | — | Accessible worked derivation of the same catenary relations as `faltinsen-1990`, for a quicker read — [Buoy Structural Load Framework §8.2](../../engineering/buoy-structural/structural-load-framework.md#82-lc-a--slack-mooring-calm-water-baseline-catenary-the-physically-correct-resting-state) |

## FDM wall count vs. infill — structural strength

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `mazlan-2023` | Mazlan, Anas, Izmin & Abdullah (2023). "Effects of Infill Density, Wall Perimeter and Layer Height in Fabricating 3D Printing Products." *Materials (Basel)* 16(2):695. [doi](https://doi.org/10.3390/ma16020695) | 🔓 | — | **PLA specimens** (FEA + tensile testing) — wall perimeter, infill, and layer height all increase tensile elasticity, but simulated strength overestimated real parts by ~3×. General wall/infill tradeoff basis, extrapolated to PETG by principle (not verified for PETG specifically) — used 2026-08-21 for the [SCO-75](https://linear.app/scout1/issue/SCO-75) chassis wall/infill recommendation |
| `ultimaker-infill-density` | UltiMaker. "3D printing infill density: Optimizing strength and speed" — knowledge base article. [ultimaker.com](https://ultimaker.com/learn/3d-printing-infill-density-optimizing-strength-and-speed/) | 🔓 | — | Vendor guidance: infill has diminishing strength returns relative to material/print-time cost — used 2026-08-21 for [SCO-75](https://linear.app/scout1/issue/SCO-75) |
| `printstack3d-strength-formula` | PrintStack3D. "The Strength Formula: Optimizing Walls, Infill, and Orientation" — blog. [printstack3d.nl](https://printstack3d.nl/en/blog/maximize-3d-print-strength) | 🔓 | — | Quantified the 2→5 wall-loop (+60% strength/+20% material) vs. 20%→80% infill (+25% strength/+150% material) tradeoff cited in [SCO-75](https://linear.app/scout1/issue/SCO-75) — used 2026-08-21 |
| `hubs-shell-infill-parameters` | Protolabs Network (Hubs). "What are the optimal shell and infill parameters for FDM 3D printing?" — knowledge base article. [hubs.com](https://www.hubs.com/knowledge-base/selecting-optimal-shell-and-infill-parameters-fdm-3d-printing/) | 🔓 | — | Confirms outer walls are the primary load path in FDM parts (behave like a hollow tube/I-beam); infill mainly braces walls against buckling — used 2026-08-21 for [SCO-75](https://linear.app/scout1/issue/SCO-75) |

## PETG mechanical properties & print anisotropy

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `kumaresan-kanny-2025` | Kumaresan & Kanny (2025). "Advanced RSM-Driven Optimisation for Enhancing the Mechanical Performance of FDM-Printed PETG: A Correlated Microstructural and Mechanical Property Investigation." *Polymers* 17(23):3175. [doi](https://doi.org/10.3390/polym17233175) | 🔓 | — | PETG-specific process-parameter optimization (layer height, raster angle, etc.) — used 2026-08-21 to confirm the existing 0.20 mm layer height is already in PETG's favorable range for [SCO-75](https://linear.app/scout1/issue/SCO-75) |
| `sciencedirect-layer-orientation-petg` | "Influence of layer orientation on the mechanical properties of fused deposition modelling using PLA and PETG." *ScienceDirect*. ❓ Paywalled — full author/year/DOI not yet confirmed (WebFetch returned 403) | ❓ | — | Cited for the finding that a 90° raster angle can cut flexural strength >40% for PETG — used 2026-08-21 to caveat that chassis print orientation matters as much as wall count in [SCO-75](https://linear.app/scout1/issue/SCO-75); citation needs verification before being treated as settled |

## Threaded insert / heat-set boss design

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `sculpteo-insert-pullout` | Sculpteo. "Pull-out resistance of threaded inserts: Testing and Results" — design guideline. [sculpteo.com](https://www.sculpteo.com/en/3d-learning-hub/design-guidelines/pull-out-resistance-of-threaded-inserts-testing-and-results/) | 🔓 | — | Insert pull-out strength depends primarily on solid perimeters around the hole, not bulk infill — used 2026-08-21 for the insert-boss finding added to [SCO-77](https://linear.app/scout1/issue/SCO-77) |
| `sovol3d-heat-set-inserts` | Sovol3D. "3D Printing with Heat-Set Inserts: Design Strong Screw Bosses That Last" — blog. [sovol3d.com](https://www.sovol3d.com/blogs/news/3d-printing-with-heat-set-inserts-design-strong-screw-bosses-that-last) | 🔓 | — | Boss diameter ≈2× insert knurl diameter, zero infill gaps inside the boss — used 2026-08-21 for [SCO-77](https://linear.app/scout1/issue/SCO-77) and the U-bolt boss spec on [SCO-75](https://linear.app/scout1/issue/SCO-75) |

## Market & commercial landscape

Used 2026-08-24 for the [Market Analysis](../../research/market-analysis.md). These are budget
documents, filings, disclosed funding rounds, and published prices rather than academic works —
the `Access` column marks whether the page is freely readable, not a redistribution licence.
**Commissioned market-research reports were deliberately excluded** (see the analysis's method
note); the two sizing estimates retained below are marked as such and nothing load-bearing
depends on them.

| Key | Work | Access | Local | Relevance / used in |
|---|---|---|---|---|
| `crs-noaa-fy2026` | Congressional Research Service (2026). "NOAA FY2026 Budget Request and Appropriations," IF13024. [congress.gov](https://www.congress.gov/crs-product/IF13024) | 🔓 | — | **IOOS enacted at $56 M for FY2026** — the size of the entire US ocean-observing line item |
| `agu-fy26-approps` | AGU (2025). "Fiscal Year 2026 Appropriations Update: NASA, NOAA and NSF." [thebridge.agu.org](https://thebridge.agu.org/2025/08/08/appropriations-update-nasa-noaa-and-nsf/) | 🔓 | — | Proposed $1.7 B NOAA cut; context for the political fragility of the science market |
| `ocean-conservancy-fy26` | Ocean Conservancy (2025). "How the Proposed Federal Budget Cuts Threaten Our Ocean." [oceanconservancy.org](https://oceanconservancy.org/blog/2025/07/09/fy26-federal-budget-threatens-ocean/) | 🔓 | — | FY2025 IOOS cut proposed at 76%, lowest since 2008 |
| `gao-24-106692` | GAO (2024). "Coral Reef Conservation Program: Opportunities Exist to Better Track Expenditures and Share Information," GAO-24-106692. [gao.gov](https://www.gao.gov/products/gao-24-106692) | 🔓 | — | **NOAA CRCP ~$33 M/yr appropriated** FY2021–23 |
| `noaa-crcp-grants` | NOAA Coral Reef Conservation Program — funded projects. [coralreef.noaa.gov](https://coralreef.noaa.gov/conservation/funded_projects.html) | 🔓 | — | ~$9 M/yr actually awarded to outside partners |
| `teledyne-10k-2025` | Teledyne Technologies (2026). Form 10-K, FY2025. [sec.gov](https://www.sec.gov/Archives/edgar/data/1094285/000109428526000017/tdy-20251228.htm) | 🔓 | — | Marine segment >$1.1 B — the category leader, but sonar/imaging/defence heavy, not $5k buoys |
| `maritime-exec-spotter-price` | Maritime Executive. "Small, Cheap Metocean Buoys Expand Coverage of High-Res Wave Data." [maritime-executive.com](https://maritime-executive.com/article/small-cheap-metocean-buoys-expand-coverage-of-high-res-wave-data) | 🔓 | — | **2nd-gen Sofar Spotter retails under $5,000**, 1,000+ deployed — i.e. our own cost target is a competitor's list price |
| `sofar-spotter-platform` | Sofar Ocean — Spotter Platform product page. [sofarocean.com](https://www.sofarocean.com/products/spotter) | 🔓 | — | Smart Mooring modules (temperature, currents, water quality, sound); Bristlemouth as an **open** third-party hardware standard — the hook for the recommended analytics-layer path |
| `sofar-spotter-sound` | Sofar Ocean — Spotter Sound / underwater acoustic monitoring. [sofarocean.com](https://www.sofarocean.com/sem/underwater-sound-acoustics) | 🔓 | — | AI-enabled hydrophone already shipping on the Spotter platform — direct overlap with S.C.O.U.T.'s acoustic channel |
| `aqualink-smart-mooring` | Sofar Ocean. "How Aqualink Uses Smart Mooring to Monitor Ocean Climate Change." [sofarocean.com](https://www.sofarocean.com/posts/how-aqualink-uses-smart-mooring-to-monitor-ocean-climate-change) | 🔓 | — | Aqualink is philanthropically funded and **donates** reef-monitoring buoys to volunteers and researchers — in our exact application, the customer's alternative is free |
| `olb-2026` | Rabault et al. (2026). "OLB: An Open LoRa Buoy for Coastal Water Measurements." arXiv:2601.05615 (Univ. of Oslo · Norwegian Meteorological Institute · NTNU). [arxiv](https://arxiv.org/html/2601.05615v1) | 🔓 | — | **Open-source LoRa buoy at $100–115/unit**, 1.2–5.3 km over water — S.C.O.U.T.'s architecture published free, three months before our Phase 1 |
| `act-biofouling-opex` | Antifouling strategies for sensors used in water monitoring: review and future perspectives. *Sensors* (via PMC). [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7827029/) | 🔓 | — | Alliance for Coastal Technologies estimate: **up to 50% of operational budgets attributable to biofouling** — the basis for "we optimised the cost that is not binding" |
| `nearshore-fouling-buoy` | Impact of heavy biofouling on a nearshore heave-pitch-roll wave buoy performance. *Applied Ocean Research*. [sciencedirect](https://www.sciencedirect.com/science/article/abs/pii/S0141118720310592) | 🔒 | — | Measured degradation and shortened service intervals on a nearshore moored buoy |
| `dealroom-blue-economy` | Dealroom. "Blue Economy" deep dive. [dealroom.co](https://dealroom.co/guides/blue-economy) | 🔓 | — | Blue-economy VC $5.6 B (2025) → $8.2 B in first 7 months of 2026; ~70% to drones and surface/subsea robots |
| `andrenam-series-a` | Andrenam (2026). "Andrenam Announces $18 Million Series A to Expand Persistent Undersea Awareness." [andrenam.com](https://andrenam.com/news/andrenam-announces-18-million-series-a-to-expand-persistent-undersea-awareness) | 🔓 | — | **$30 M total to field 35 passive-acoustic buoys** — the real capital curve for defence-grade underwater acoustics |
| `triton-depth-preseed` | Defence Industry Europe (2026). "Triton Depth raises €1 million pre-seed for passive acoustic sensor network." [defence-industry.eu](https://defence-industry.eu/triton-depth-raises-e1-million-pre-seed-round-to-develop-passive-acoustic-sensor-network-for-europes-underwater-security-and-maritime-intelligence/) | 🔓 | — | European comparable; seabed passive acoustics framed on subsea-cable sabotage |
| `saildrone-sacra` | Sacra equity research — Saildrone (updated 2026-02-27). [sacra.com](https://sacra.com/c/saildrone/) | 🔓 | — | $345 M raised against $37 M revenue (2025); $16.3 M Navy task order — burn-to-revenue reality for ocean-robotics hardware |
| `lockheed-saildrone` | Lockheed Martin (2025). "Lockheed Martin Invests $50M in Saildrone." [lockheedmartin.com](https://news.lockheedmartin.com/2025-10-29-Lockheed-Martin-Invests-50M-in-Saildrone-to-Advance-Unmanned-Surface-Vehicle-Capabilities-for-US-Navy) | 🔓 | — | Prime-contractor capital entering maritime autonomy; signals who the eventual acquirers are |
| `erapsco-navy-sonobuoy` | Naval Technology. "ERAPSCO wins contract to produce sonobuoys for US Navy." [naval-technology.com](https://www.naval-technology.com/news/erapsco-wins-contract-to-produce-sonobuoys-for-us-navy/) | 🔓 | — | Ultra/Sparton JV holds an **exclusive** US Navy sonobuoy production contract at ~200k–500k units/yr — the cheap-disposable-acoustic niche is already sole-sourced |
| `mordor-sonobuoy` | Mordor Intelligence. Sonobuoy market report. [mordorintelligence.com](https://www.mordorintelligence.com/industry-reports/sonobuoy-market) | ❓ | — | ⚠️ **Commissioned sizing estimate (~$512 M, 2026), order-of-magnitude only.** Cited for scale context; no conclusion depends on it |
| `diu-front-door` | Spencer Fane (2026). "Defense Innovation Unit: The Pentagon's Front Door for Unmanned Systems Technology Companies." [spencerfane.com](https://www.spencerfane.com/insight/defense-innovation-unit-the-pentagons-front-door-for-unmanned-systems-technology-companies/) | 🔓 | — | June 2026 SecDef memo makes DIU the designated commercial entry point for unmanned/autonomous systems and their sensors — the defence path if we ever take it |
| `diu-swap-usv` | DIU — Suitable Warfighting Adaptive Payloads (SWAP-USV), PROJ00687. [diu.mil](https://www.diu.mil/work-with-us/submit-solution/PROJ00687) | 🔓 | — | $200 M budgeted across prototype/production OTs; example of the CSO/OTA mechanism |
| `gminsights-aquaculture` | GMInsights. Aquaculture Monitoring and Automation Systems Market. [gminsights.com](https://www.gminsights.com/industry-analysis/aquaculture-monitoring-and-automation-systems-market) | ❓ | — | ⚠️ **Commissioned sizing estimate, directional only.** Used for the structural point that aquaculture buyers have revenue-linked urgency, not for the dollar figure |
| `swissre-quintana-roo` | Swiss Re. "Protecting the world's second biggest coral reef with an innovative parametric solution." [swissre.com](https://www.swissre.com/our-business/public-sector-solutions/case-studies/mexico-windstorm-cover.html) | 🔓 | — | Quintana Roo parametric reef cover; $850k payout after Hurricane Delta (2020) |
| `icri-mar-fund-payout` | ICRI. "First pay-out of Mesoamerican Reef Insurance Programme in Belize." [icriforum.org](https://icriforum.org/first-reef-insurance-payout-belize/) | 🔓 | — | $175k payout, Hurricane Lisa (2022); with SST-triggered products in development, insurers are a plausible buyer of reef data — but the programme scale makes them a design partner, not a market |
| `venturewell-ocean-accelerator` | VentureWell. Spring 2026 Ocean Enterprise Accelerator Stage 2 cohort. [venturewell.org](https://venturewell.org/spring-2026-stage-2-ocean-enterprise-accelerator-cohort/) | 🔓 | — | Non-dilutive programme aimed at exactly this stage — named in the analysis's recommended next steps |
| `boem-poweron` | BOEM (2026). "BOEM Announces POWERON Acoustic Monitoring Program for Offshore Wind Projects." [boem.gov](https://www.boem.gov/newsroom/press-releases/boem-announces-poweron-acoustic-monitoring-program-offshore-wind-projects) | 🔓 | — | **BOEM requires long-term PAM on offshore wind lease areas**; POWERON lets lessees pay annual contributions for approved third parties to fulfil it. $5.8 M IRA seed; Revolution Wind, South Fork Wind (Ørsted), Coastal Virginia Offshore Wind (Dominion) opted in — the mandated, budgeted buyer identified in [Market Analysis §8.3](../../research/market-analysis.md) |
| `noaa-boem-pam-framework` | NOAA Fisheries. "New Passive Acoustic Monitoring Framework to Help Safeguard Marine Resources During Offshore Wind Development." [fisheries.noaa.gov](https://www.fisheries.noaa.gov/feature-story/new-passive-acoustic-monitoring-framework-help-safeguard-marine-resources-during) | 🔓 | — | Regulator-published PAM framework for offshore wind — the written standard a compliance analysis product would have to meet |
| `boem-noaa-pam-minimum-recs` | Van Parijs et al. "NOAA and BOEM Minimum Recommendations for Use of Passive Acoustic Listening Systems in Offshore Wind Energy Development Monitoring and Mitigation Programs." *Frontiers in Marine Science* 8:760840. [doi](https://doi.org/10.3389/fmars.2021.760840) | 🔓 | — | The specific minimum requirements; named in [§8.9](../../research/market-analysis.md) as the gap analysis that *is* the product roadmap |
| `jasco-offshore-wind` | JASCO Applied Sciences — Offshore Wind capability page. [jasco.com](https://www.jasco.com/wind) | 🔓 | — | The PAM incumbent (founded 1981; contractor on Ørsted's South Fork Wind). Cited so the analysis does not pretend the niche is empty |
| `scu-ip-policy` | Santa Clara University — Intellectual Property (Office of the Provost); patent and copyright policy at Faculty Handbook §3.7.5–3.7.6. [scu.edu](https://www.scu.edu/provost/research/research-compliance-and-integrity/intellectual-property/) | 🔓 | — | **Defines "Inventor" to include students** using University funds, facilities or other resources; 50/50 net-royalty split on University-owned inventions. The ownership gate in [§8.2](../../research/market-analysis.md) — must be settled in writing before any spin-out |
| `scu-policy-313-patent` | Santa Clara University — Staff Policy Manual, Policy 313: Patent Policy. [scu.edu](https://www.scu.edu/hr/employee-resources/policies-and-guidelines/staff-policy-manual/policy-313---patent-policy/) | 🔓 | — | Companion patent policy; disclosure route is `patents@scu.edu` / 408-554-4408 |
| `scu-ventures-accelerator` | Santa Clara Ventures — Bronco Venture Accelerator. [santaclaraventures.com](https://santaclaraventures.com/santa-clara-university) | 🔓 | — | On-campus accelerator, free while enrolled — named in [§8.2](../../research/market-analysis.md) |
| `scu-law-clinic` | Santa Clara Law — Entrepreneurs' Law Clinic. [law.scu.edu](https://law.scu.edu/) | 🔓 | — | Free IP-licensing and startup legal work for SCU companies; the route to negotiating a licence back if SCU claims ownership |
| `getlatka-sofar` | GetLatka company profile — Sofar Ocean. [getlatka.com](https://getlatka.com/companies/sofarocean.com) | 🔓 | — | ⚠️ **Unreliable.** Source of the ~$18 M revenue / 123-staff estimate, but simultaneously claims Sofar raised $0 and is bootstrapped, which is false. Retained only because it is the sole public revenue estimate; treat as directional and never cite alone |

## Maintenance

- **Adding a source:** add a row to the right topic table, fill DOI + access, and — if you have
  the PDF — drop it in `library/` (🔓) or `library-restricted/` (🔒) named `<key>.pdf` and fill
  **Local**. If it's worth a paragraph, add a note in [`notes/`](notes/).
- **Access ❓ rows** need their license confirmed before any PDF is committed. When in doubt,
  leave the file out of the public repo and keep the DOI link.
- Strip tracking parameters (`?utm_source=…`) from every URL per
  [CONVENTIONS.md → Citing sources](../CONVENTIONS.md#citing-sources).
