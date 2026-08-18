# Biofouling Antifouling Coatings

> **Summary** — Candidate antifouling paint/coating products for the buoy's mitigation
> approach ([SCO-15](https://linear.app/scout1/issue/SCO-15)), researched against three
> criteria: cost-effective, purchasable in low quantity (a small buoy needs far less than a
> boat hull), and ideally available at a general hardware retailer. Flags a real tension
> between the "Home Depot" criterion and the project's own reef-safe design principle
> ([ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md)).

---

## Why paint/coating over the other candidates

[SCO-15](https://linear.app/scout1/issue/SCO-15) named three families of mitigation:
mechanical wipers, copper mesh, and antifouling coatings. John Ryan chose **coatings** —
cost-effective, no moving parts to fail on a 1+ year unattended deployment, and a mature,
widely-available product category rather than a custom mechanical build.

## The reef-safety tension

This project's mission is coral reef monitoring, and [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md)
already established reef-safety as a hard design constraint for the mooring. **The same
constraint applies here, and it cuts directly against the "buy it at Home Depot" convenience
criterion:**

- The antifouling products actually stocked at general retailers (Home Depot, Lowe's, True
  Value) are almost universally **copper-based** — they work by slowly releasing cuprous
  oxide into the water.
- Copper is toxic to coral polyps and their symbiotic zooxanthellae even at low
  concentrations — this is the same category of environmental concern that ruled out a
  copper-mesh mitigation approach in the first place, and it would apply just as directly to a
  copper-based paint sitting a few meters from the reef being monitored.
- **Copper-free biocides exist** (Econea, zinc pyrithione, tralopyril) and are marketed
  specifically for environmentally sensitive water — but none of the copper-free products
  found are stocked at general hardware retailers; they come from specialty marine suppliers
  (West Marine, Defender, Fisheries Supply, Hamilton Marine) and cost roughly **2–4× more**
  per container than the copper-based Home Depot option.

**This needs a call from John Ryan, not a default pick.** The options below are presented
without a single "chosen" row for that reason.

## Candidates

| Product | Type | Smallest size found | Approx. price | Where to buy | Reef-safety note |
|---|---|---|---|---|---|
| [Rust-Oleum Marine Boat Bottom Antifouling Paint](https://www.homedepot.com/p/Rust-Oleum-Marine-1-qt-Flat-Blue-Boat-Bottom-Antifouling-Paint-396968/100184819) | Copper-based (releases cuprous oxide) | 1 quart | ~\$32–82/quart (varies by retailer/color — see sources) | **Home Depot**, Lowe's, True Value, Walmart, Amazon | Not reef-safe — copper biocide |
| [TotalBoat Underdog](https://www.totalboat.com/products/underdog-antifouling-bottom-paint) | Copper-based (24% cuprous oxide, ablative) | 1 gallon (no smaller size found) | ~\$83/gallon | TotalBoat, Amazon | Not reef-safe — copper biocide |
| [TotalBoat Krypton](https://www.totalboat.com/products/krypton-antifouling-bottom-paint) | Copper-free (zinc pyrithione 4.8% + tralopyril 6%) | 1 quart | \$119.99/quart | TotalBoat (online only) | Marketed "eco-friendly," designed for copper-restricted waters. No third-party reef-safe certification found |
| [Sea Hawk Smart Solution](https://www.westmarine.com/sea-hawk-smart-solution-antifouling-paint-P018194134.html) | Copper-free / metal-free (Econea biocide) | **1 pint** — smallest quantity of any candidate | ~\$50–64/pint (varies by retailer — see sources) | Hamilton Marine, Fisheries Supply, West Marine, Defender (online only) | Metal-free, described as no-bioaccumulation. Best fit if reef-safety is prioritized over retailer convenience |

A quart covers roughly 125 sq ft at a standard 2-mil coat ([TotalBoat Krypton
spec](https://www.totalboat.com/products/krypton-antifouling-bottom-paint)) — a small buoy's
wetted surface is a small fraction of that, so even the pint size is likely more than one
buoy needs. Container size drives the purchase decision more than actual coverage need does.

## Recommendation

If reef-safety is weighted as a hard constraint (consistent with ADR-0004 and the project's
mission), **Sea Hawk Smart Solution in a pint** is the best fit found: smallest available
quantity, copper-free, and the only candidate marketed specifically as low-bioaccumulation.
It costs more per container than the Home Depot option and isn't available at a general
retailer.

If retailer convenience is weighted higher, the Rust-Oleum Marine quart at Home Depot is the
cheapest and most accessible option, but it is a copper-releasing product deployed meters from
the reef this project exists to protect — worth weighing against the optics and substance of
that, not just the convenience.

## Sources

- [Rust-Oleum Marine 1 qt. Flat Blue Boat Bottom Antifouling Paint — The Home Depot](https://www.homedepot.com/p/Rust-Oleum-Marine-1-qt-Flat-Blue-Boat-Bottom-Antifouling-Paint-396968/100184819)
- [Rust-Oleum Marine Boat Bottom Antifouling Paint, Blue, 1 Qt. — True Value](https://www.truevalue.com/product/778966/rust-oleum-marine-boat-bottom-antifouling-paint-blue-1-qt-778966/)
- [TotalBoat Underdog Antifouling Bottom Paint](https://www.totalboat.com/products/underdog-antifouling-bottom-paint)
- [TotalBoat Krypton Copper-Free Antifouling Bottom Paint](https://www.totalboat.com/products/krypton-antifouling-bottom-paint)
- [Sea Hawk Smart Solution Antifouling Paint — West Marine](https://www.westmarine.com/sea-hawk-smart-solution-antifouling-paint-P018194134.html)
- [Sea Hawk Antifouling Paint Smart Solution, Pint — Hamilton Marine](https://shop.hamiltonmarine.com/products/sea-hawk-antifouling-paint-smart-solution-gray-pint-30277.html)
- [What are the differences between copper-free and copper-based antifouling paint? — TotalBoat](https://support.totalboat.com/hc/en-us/articles/1260800665049-What-are-the-differences-between-copper-free-and-copper-based-antifouling-paint)
