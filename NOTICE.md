# NOTICE

`cctweaked4tfgm` contains no Minecraft mod code. It is a documentation site and
a set of build scripts. The data it renders is derived from third-party sources,
listed below.

## First party

Files under `scripts/`, `ci/`, `site/`, and all prose in `docs/**/*.md`
are MIT licensed, © TerraFirmaGreg Translation CN.

## Derived data (`docs/data/`)

| Data | Source | Upstream licence |
| --- | --- | --- |
| `tfgm/*/recipes.json`, `quests.json`, `config.json`, `lang.json`, `meta.json` | [Modpack-Modern](https://github.com/TerraFirmaGreg-Team/Modpack-Modern) release | Modpack-Modern repository licence |
| `tfgm/*/turtle-upgrades.json` | Modpack-Modern `kubejs/` + item registry | Modpack-Modern repository licence |
| `tfgm/*/labels.json` | EMI export of the same release (`items-lang`) | item names originate from the mods that define them |
| `emi/recipes/**` | published TerraFirmaGreg recipe-book bundle (`tfg-<tag>`) | Modpack-Modern repository licence |
| `emi/icons/*`, `emi/items-lang/*`, `emi/lang/*`, `emi/tags/*` | same EMI bundle, pruned to the CC/AP recipe set | item textures and names remain the property of their mod authors |
| `emi-map.json` | mapping from `recipes.json` rows to EMI layout ids | Modpack-Modern repository licence |
| `cc/pages.json`, `cc/pages/**` | rendered page bodies from <https://tweaked.cc/mc-1.20.x/> | MPL-2.0, © CC: Tweaked contributors |
| `public/images/**` | item icons and screenshots referenced by those pages | item icons remain Mojang/mod authors' property |
| `cc-index.json` | [CC: Tweaked](https://github.com/cc-tweaked/CC-Tweaked) generated site index | MPL-2.0 |

Recipe, quest and config data is reproduced for reference purposes. Item names
and Lua API documentation remain the property of their respective mod authors.

## Site layout

The layout mirrors the structure of <https://tweaked.cc/>, whose documentation
template comes from [illuaminate](https://github.com/SquidDev/illuaminate)
(BSD-3-Clause, © SquidDev). The CSS in `site/main.css` is a reimplementation of
that layout with a TerraFirmaGreg palette, not a copy of the upstream stylesheet.
The recipe cards are rendered by
[`emi-recipe-renderer`](https://github.com/jmecn/emi-recipe-renderer) (MIT) at
runtime, from the bundle described above.

## Quoted material

- CC: Tweaked is MPL-2.0. The reference pages under `docs/data/cc/` are
  reproduced from <https://tweaked.cc/mc-1.20.x/> under that licence; the
  corresponding source is <https://github.com/cc-tweaked/CC-Tweaked>.
  TerraFirmaGreg inserts are marked with a "TerraFirmaGreg" callout and link
  back to the `/tfgm/` section.
- ComputerCraft (the original mod by Daniel Ratcliffe) is distributed under the
  ComputerCraft Public License (`LicenseRef-CCPL`). This repository does not
  include ComputerCraft code.

## Trademarks

Minecraft is a trademark of Mojang Synergies AB. ComputerCraft, CC: Tweaked,
GregTech, TerraFirmaCraft and TerraFirmaGreg are the property of their
respective authors. This project is unofficial and not endorsed by any of them.
