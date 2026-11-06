# California vs Hawaii: Test Assumptions

> **Summary** — The Monterey Bay or Santa Cruz test is a stand-in for Hawaii. This page lists what
> differs between the two (temperature, salinity, waves, tides, water clarity, marine life, sun, site
> setting), what each difference does to a California test result, and why it is an acceptable test
> condition or a stated limit. Written for [SCO-210](https://linear.app/scout1/issue/SCO-210) from the
> 2026-10-21 advisor meeting. Only figures with a source are given as numbers; the rest are marked
> **to confirm** so no one reads a guess as data.
>
> Part of the [planning docs](team-timeline.md). Read with the [deployment strategy](deployment-strategy.md).

---

## How to read this

California is a **systems and survivability test**; Hawaii (Kāneʻohe Bay) is the only place that gives reef data
([deployment strategy](deployment-strategy.md)). So each row asks two things: does the difference make a California
**pass** mean less in Hawaii, and does it make a California **fail** unfair?

| Verdict | Meaning |
|---|---|
| **Safe** | California is the harsher or equal condition: a pass there is a stronger pass for Hawaii |
| **Limit** | California is easier or different: a pass there does not cover Hawaii, and the gap is closed in Hawaii |
| **Neutral** | Different, but it does not change what the test shows |

## Differences, effect and reasoning

| # | Factor | California (Monterey Bay or Santa Cruz) | Hawaii (Kāneʻohe Bay) | Effect on the test | Why acceptable, or the limit | Verdict |
|---|---|---|---|---|---|---|
| 1 | Water temperature | Cold: offshore central California about 12.2 to 15.5 °C over the year, coldest in the upwelling season (about March to July) ([NOAA sanctuary profile](https://montereybay.noaa.gov/sitechar/phys22.html), [upwelling](https://sanctuarysimon.org/monterey-bay-nms/oceanography/)). Nearshore and harbor values to confirm | Warm; the bay's yearly mean runs higher than the open ocean's ([Bathen 1968](https://www.soest.hawaii.edu/oceanography/masters/1968-Bathen.PDF)). Seasonal range to confirm from [PacIOOS](https://www.pacioos.hawaii.edu/water/buoy-kaneohe/) and NCEI mooring data | Battery capacity and electronics run in colder water than in Hawaii; the temperature sensor never sees reef-warm water | Cold lowers usable battery capacity, so a California endurance result is expected to be conservative (expected, not measured). Sensor accuracy is checked on the bench against a reference, not in California water | Safe for battery, Limit for sensor range |
| 2 | Salinity | Nearshore surface about 33.2 to 34.0 psu, and it does not drop below about 31 psu even in floods ([NOAA sanctuary profile](https://montereybay.noaa.gov/sitechar/phys22.html)) | Expected near open-ocean value with freshening after rain runoff into the bay (to confirm; NCEI mooring series, 2005 to 2007) | The tub standard is plain salt at 35 g per kg, a little saltier than Monterey, so the buoy floats slightly higher in the tub than in Monterey water | The difference is small. Check any freeboard result against the [float displacement tool](../../mechanical/simulations/buoy-stability/float-displacement/README.md) for the actual water. Comparing plain salt to real seawater was cancelled 2026-11-06, so this gap stays unmeasured | Neutral |
| 3 | Waves and sea state | Open Pacific swell; exposed sites see winter waves well above a sheltered harbor, and sites in the same bay differ a lot ([USGS](https://www.usgs.gov/publications/local-wave-climate-and-long-term-bed-shear-stress-characteristics-monterey-bay-ca)). Numbers for the chosen site from [NDBC 46042](https://www.ndbc.noaa.gov/station_page.php?station=46042) (to pull) | Kāneʻohe Bay is sheltered by its barrier reef; the 2 to 8 m bay site is calm compared with the open coast ([Hawaii permitting](../research/hawaii-deployment-permitting.md)). The PacIOOS buoy is outside the bay, so it does not describe it | A buoy that survives a rougher California site is tested harder than Hawaii will test it | The advisors named harsher California waves as a useful limit: surviving there suggests surviving in Hawaii. **This only holds if the chosen California site is not a calm marina**; a harbor dock tests less than the bay | Safe, if the site is exposed enough |
| 4 | Tides and water level | Mixed tide with a range the dock host must give us (to confirm for the chosen dock) | Small tide range in the bay (to confirm) | The line and attachment must follow the tide without hanging the buoy or slamming the dock ([dock-test notes](../research/monterey-santa-cruz-dock-test-hosts-and-permissions.md)) | A larger California range is a harsher line-handling test than Hawaii needs | Safe |
| 5 | Water clarity and turbidity | Plankton blooms and suspended sediment; values to confirm | Bay water turns murky after rain; a boat slip is shallower, sheltered and often murkier than the 2 to 8 m bay site ([Hawaii permitting](../research/hawaii-deployment-permitting.md)) | Turbidity readings from California are real seawater readings, not reef readings. The turbidity sensor calibration ([SCO-12](https://linear.app/scout1/issue/SCO-12)) is done against formazin standards, not in the field | Use California to prove the sensor reads and survives. Do not use it to set reef turbidity ranges or alarms | Limit |
| 6 | Marine life and fouling | Kelp forest and rocky reef; barnacles, mussels and algae; sea otters and seals near docks. No reef-building coral | Reef-building coral right next to the site; tropical fouling, reported faster in warm water (expected, not measured here) | A California fouling result tells us little about Hawaii fouling speed or what grows on the sensor faces. Reef safety of the coating and antifouling cannot be shown in California | Copper-free antifouling is chosen for reef safety ([biofouling research](../research/biofouling-antifouling-coatings.md)) and is untested for it; the biofouling test and pass mark are still open ([SCO-273](https://linear.app/scout1/issue/SCO-273)). Closed in Hawaii | Limit |
| 7 | Sunlight, UV and heating | Less direct sun than Hawaii (to confirm for the chosen site) | Strong tropical sun on a dark coated buoy | The coating and printed PETG see less UV and less solar heating in California | Coating durability is a separate test ([SCO-78](https://linear.app/scout1/issue/SCO-78), Jan 2027). Solar was removed from the design, so there is no panel to test in either place | Limit |
| 8 | Site setting | Harbor dock, slip or pier, hung or tethered; a host owns the structure | Kāneʻohe Bay mooring (CRIMP2 via HIMB), a boat slip at the yacht club, or an attended boat ([deployment strategy](deployment-strategy.md)) | A dock hang is a motion and recovery test, not a mooring test: nothing here proves an anchor or a mooring load | Both sites use permitting path B (no anchor of our own). The mooring FEA (RR-04 to RR-09) covers loads analytically | Limit |
| 9 | Radio path over water | Shore station on land near the dock; range depends on the site | Shore link across the bay from a different site; range to confirm | LoRa range and packet loss measured in California do not transfer to the Hawaii path | Measure the link at each site; California proves the packet is sent, received and processed ([SCO-182](https://linear.app/scout1/issue/SCO-182)) | Limit |
| 10 | Rules and permission | National marine sanctuary; the sanctuary says a tethered buoy likely needs no permit ([Monterey sanctuary permitting](../research/monterey-bay-sanctuary-permitting.md)) | State submerged lands, DOBOR, DLNR and the Corps ([Hawaii permitting](../research/hawaii-deployment-permitting.md)) | A California pass says nothing about whether Hawaii approves | Written answers are filed before each deployment ([SCO-222](https://linear.app/scout1/issue/SCO-222), [SCO-185](https://linear.app/scout1/issue/SCO-185)) | Neutral |

## What a California pass does and does not show

| A California result shows | It does not show |
|---|---|
| The buoy floats, rights itself and holds its seals in real seawater | Reef water quality, coral health, or Hawaii turbidity and temperature ranges |
| The sensors read and a packet reaches the shore station | LoRa range or packet loss over the Hawaii path |
| The line, attachment and recovery work in rougher water than the bay (if the site is exposed) | Mooring behavior or anchor loads |
| Cold-water battery use (expected to be conservative) | Warm-water battery or sensor drift, UV and tropical fouling |

## Data to pull before the thesis cites numbers

| Item | Where | Needed for |
|---|---|---|
| Nearshore temperature and salinity at the chosen California dock | The host, MBARI or NOAA moorings | Rows 1, 2 |
| Kāneʻohe Bay temperature, salinity and rain-runoff range | [PacIOOS](https://www.pacioos.hawaii.edu/water/buoy-kaneohe/), NCEI Kāneʻohe moorings 2005 to 2007 | Rows 1, 2, 5 |
| Wave height statistics (annual mean and winter maximum) for the chosen California site | [NDBC 46042](https://www.ndbc.noaa.gov/station_page.php?station=46042) and the nearest harbor station | Row 3 |
| Tide range at the chosen dock and in the bay | NOAA tide tables | Row 4 |

Sources are logged in the [source registry](../hub/research/sources.md).
