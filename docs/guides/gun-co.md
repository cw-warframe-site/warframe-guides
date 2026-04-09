---
template: guide.html
---

# GunCO Spreadsheet

<div class="inline-toc" markdown="1">
<p class="inline-toc__title">Table of Contents</p>

- [Overview](#overview)
- [Link](#link)
- [Navigating the Spreadsheet](#navigating-the-spreadsheet)

</div>

## Overview

Condition Overload (CO) and its gun counterparts, collectively refered to as 'GunCO' (Galvanized Aptitude, Savvy, and Shot), are mods that scale your weapon's direct damage (non-AOE) by the number of unique status effects on the target. 

However, CO mods do not work exactly as written. In some cases, CO will either be stronger or weaker than the mod description implies.

There are several cases where CO behaves differently than expected including:

- Some weapons may appear to deal AOE damage but are not coded as such (e.g. Arca Plasmor), so CO will apply
- CO scales multiplicatively on some weapons instead of additively
- Incarnon evolution perks that buff base damage do not scale with CO, unless CO already scales multiplicatively on that weapon
- Stances and their combos have internal multipliers that affect CO scaling

Due to all these unintuitive interactions, several players have done extensive testing and created a document that lists out how CO affects different weapons. That compiled data can be found in the chart below.

> **Note:** If an older weapon is not on the chart, it most likely works as intended. If it's a new weapon, it may not have been tested yet. 

---
## Link
*Spreadsheet last updated for Version 40.0.0*
[Galvanized GunCO on Projectiles Spreadsheet](https://docs.google.com/spreadsheets/d/1ryemX4Y2vWy9LjuJ355bWVNuBhzLaHTTFqPeTNto9RA/edit?gid=883121879#gid=883121879)

---
## Navigating the Spreadsheet


While the document explains all the labels, colors, and numbers, I've included three terms below to help you quickly interpret the chart.

### Key Terms

**CO Factor** - How effective CO is compared to its intended behavior

- 100% = Working as intended
- \> 100% = Working better than intended
- < 100% = Working worse than intended

**'+ Damage Math'** - Whether the CO effect is additive or multiplicative with %damage mods like Serration

- Additive = Working as intended
- Multiplicative = Unintended buff, stronger than intended

**Single Target Value** - The percentage of the weapon's damage that scales with CO effects.

- 100% = Works as intended, use as appropriate
- < 100% = Weaker, generally avoid unless you can apply lots of unique status effects