---
layout: home
hero:
  name: 'CC: Tweaked for TerraFirmaGreg'
  text: Programmable computers in a GregTech pack
  tagline: Versioned recipes, turtle upgrades and quest mapping for TerraFirmaGreg Modern — plus the CC:T API the pack ships.
  actions:
    - theme: brand
      text: Read the guide
      link: /guide/
    - theme: alt
      text: Recipe list
      link: /recipes/
    - theme: alt
      text: Upstream docs
      link: https://tweaked.cc/
features:
  - title: What TFGM changes
    details: Every CC:T recipe is deleted and rebuilt on GregTech machines, gated from MV to LuV. Turtles stay craftable but are hidden from the creative tab.
    link: /guide/differences
    linkText: Compare with upstream
  - title: Recipe reference
    details: Searchable table of all 54 CC/AP recipes in the release, each linking into the exported EMI bundle for the rendered card.
    link: /recipes/
    linkText: Browse recipes
  - title: Turtle upgrades
    details: 20 GT materials × 5 tool types = 73 tool upgrades, generated from the shipped item registry.
    link: /guide/turtle-upgrades
    linkText: See the matrix
  - title: Lua API index
    details: The CC:T 1.121.0 global/API/peripheral surface, mapped to tweaked.cc for the exact version.
    link: /api/
    linkText: Open the index
---

<VersionPill show-core />

## What this repository is

`cctweaked4tfgm` documents **the CC: Tweaked that TerraFirmaGreg Modern actually ships**. It is not a fork of CC: Tweaked and contains no Minecraft code. It is a documentation and data site in the same family as
[QuestBook-Modern](https://github.com/TerraFirmaGreg-Team/QuestBook-Modern),
[Field-Guide-Modern](https://github.com/TerraFirmaGreg-Team/Field-Guide-Modern) and
[RecipeBook-Modern](https://github.com/TerraFirmaGreg-Team/RecipeBook-Modern):

| Repository | Exports | Answers |
| --- | --- | --- |
| QuestBook-Modern | FTB Quests chapter data | *what does the pack ask me to do?* |
| Field-Guide-Modern | Patchouli field guide | *how does this mechanic work?* |
| RecipeBook-Modern | EMI recipe bundle | *how do I craft it?* |
| **cctweaked4tfgm** | CC:T surface + TFGM deltas | *what did TFGM change about computers?* |

The data layer is generated from the release itself (see [Data pipeline](/guide/data-pipeline)), so when TFGM bumps CC:T the tables here follow.

## Scope

<RecipeBrowser :show-removals="true" />
