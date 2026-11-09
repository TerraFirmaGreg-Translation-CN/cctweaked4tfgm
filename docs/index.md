---
title: CC: Tweaked for TerraFirmaGreg
order: 0
---

<h1 class="home-logo"><img src="/cctweaked4tfgm/logo.png" alt="CC: Tweaked for TerraFirmaGreg" /></h1>

**CC: Tweaked for TerraFirmaGreg** documents the computers, turtles and peripherals that
[TerraFirmaGreg Modern](https://github.com/TerraFirmaGreg-Team/Modpack-Modern) actually ships. The mod is the ordinary
CC: Tweaked JAR; this site records what the pack changes around it and gives you the matching Lua API index.

<VersionPill show-core />

It is not a fork of CC: Tweaked: no Minecraft code, no mixins and no recipe scripts live here. It belongs to the same
family as the other TerraFirmaGreg data projects:

<table class="definition-list">
<tbody>
<tr><th><a href="https://github.com/TerraFirmaGreg-Team/QuestBook-Modern">QuestBook-Modern</a></th><td>FTB Quests chapter data — <em>what does the pack ask me to do?</em></td></tr>
<tr><th><a href="https://github.com/TerraFirmaGreg-Team/Field-Guide-Modern">Field-Guide-Modern</a></th><td>Patchouli field guide — <em>how does this mechanic work?</em></td></tr>
<tr><th><a href="https://github.com/TerraFirmaGreg-Team/RecipeBook-Modern">RecipeBook-Modern</a></th><td>EMI recipe bundle — <em>how do I craft it?</em></td></tr>
<tr><th>cctweaked4tfgm</th><td>CC:T surface + TFGM deltas — <em>what did TerraFirmaGreg change about computers?</em></td></tr>
</tbody>
</table>

## What this release contains

<table class="definition-list">
<tbody>
<tr><th><a href="/recipes/">Recipes</a></th><td>Every CC:T recipe is deleted and rebuilt on GregTech machines (MV → LuV). All 54 layouts render here from an EMI bundle derived from the same release.</td></tr>
<tr><th><a href="/guide/turtle-upgrades">Turtle upgrades</a></th><td>20 GregTech materials × 5 tool types = 73 <code>computercraft:tool</code> upgrades, derived from the shipped item registry.</td></tr>
<tr><th><a href="/quests/">Quest mapping</a></th><td>The 55-quest ComputerCraft chapter with its dependency graph and required items.</td></tr>
<tr><th><a href="/api/">Lua API</a></th><td>The complete CC:T 1.121.0 symbol index, pinned to the version in the pack and linked to the matching tweaked.cc page.</td></tr>
<tr><th><a href="/guide/">Guide</a></th><td>The TFGM delta item by item: recipes, progression, language, config, Advanced Peripherals and version history.</td></tr>
</tbody>
</table>

## Recipe set

<RecipeBrowser show-removals />

## Where the data comes from

Nothing on this site is transcribed by hand. `scripts/extract-tfgm.mjs` executes the Modpack-Modern KubeJS recipe scripts
against a recording mock, reads the quest chapter, config and language files from the same release, and writes
`docs/data/`. `scripts/fetch-emi-bundle.mjs` then extracts the matching EMI layouts and icon atlas from the published
TerraFirmaGreg recipe-book bundle, so the cards here are the game's own rendered recipes rather than a re-drawing.

See [the data pipeline](/guide/data-pipeline) for the full sequence and the checks that gate a release.
