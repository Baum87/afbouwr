# Metalstud Wand — Formules & Aannames

## Wandoppervlakte
```
wand_oppervlakte = wand_lengte × wand_hoogte
```

## U-profielen (onder- en bovenregel)
```
profiel_u_aantal = CEIL((wand_lengte / (profiel_u_lengte_mm / 1000)) × 2)
```
**Aanname:** ×2 voor zowel onderregel als bovenregel.

## C-profielen (verticale stijlen)
```
profiel_c_aantal = CEIL(wand_lengte / hoh_afstand) + 1
```
**Aanname:** +1 voor de sluitstijl aan het einde van de wand.

## Gipskarton
```
gips_oppervlakte = (gips_breedte_mm / 1000) × (gips_lengte_mm / 1000)
platen_per_zijde = CEIL(wand_oppervlakte / gips_oppervlakte)
totaal_lagen     = gips_lagen_links + gips_lagen_rechts
gips_aantal      = platen_per_zijde × totaal_lagen
```

## Isolatie (indien van toepassing)
```
isolatie_plaat_opp = 1.350 m × 0.600 m = 0.81 m²
iso_aantal = CEIL((wand_oppervlakte / isolatie_plaat_opp) × isolatie_lagen)
```
**Vaste maten:** 1350 × 600 mm per isolatieplaat.

## Wandtype configuratie
| Type           | Dikte | Gips L | C-profiel | Gips R | Isolatie |
|----------------|-------|--------|-----------|--------|----------|
| MS100 1.75.1A  | 100mm | 1×     | C75       | 1×     | 1 laag   |
| MS100 2.50.2A  | 100mm | 2×     | C50       | 2×     | 1 laag   |
| MS125 2.75.2A  | 125mm | 2×     | C75       | 2×     | 1 laag   |
| MS125 1.100.1A | 125mm | 1×     | C100      | 1×     | 1 laag   |

## Te verfijnen (ntb)
- Dikte isolatie (45/60mm) heeft nog geen invloed op berekening — keuze wordt geregistreerd
- Gipstype (AK/Hydro/Ladura) heeft geen invloed op aantallen
- Snijverlies niet meegenomen — eventueel factor toevoegen
