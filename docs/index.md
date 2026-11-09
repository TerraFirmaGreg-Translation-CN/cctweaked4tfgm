---
title: CC: Tweaked for TerraFirmaGreg
order: 0
---

<h1 class="home-logo"><img src="/cctweaked4tfgm/logo.png" alt="CC: Tweaked for TerraFirmaGreg" /></h1>

CC: Tweaked is a mod for Minecraft which adds programmable computers, turtles and more to the game. A fork of the
much-beloved [ComputerCraft](https://github.com/dan200/ComputerCraft), it continues its legacy with improved performance
and stability, along with a wealth of new features.

This site is the **TerraFirmaGreg Modern** copy of the CC: Tweaked documentation. The reference is pinned to the exact
JAR the pack ships; the [TerraFirmaGreg changes](/tfgm/) are documented separately and inserted where they affect a page.

<VersionPill show-core />

## Features

Controlled using the [Lua programming language](https://www.lua.org/), CC: Tweaked's computers provide all the tools you
need to start writing code and automating your Minecraft world. The [Globals](/module/_G/) section documents every API
available from a computer.

While computers are powerful, they cannot move. *Turtles* are the solution: they can move about the world, place and
break blocks, swing a sword, or whatever else you program them to. The [`turtle` API](/module/turtle/) covers them.

Not all problems can be solved with a pickaxe, so CC also provides additional [peripherals](/peripheral/computer/) for
computers: play a tune with [speakers](/peripheral/speaker/), display text or images on a [monitor](/peripheral/monitor/),
connect computers together with [modems](/peripheral/modem/), and much more.

Computers can interact with inventories such as chests, letting you build inventory and item management systems. See the
[generic peripherals](/generic_peripheral/inventory/) for the common capability surface.

## TerraFirmaGreg changes

TerraFirmaGreg does not fork CC: Tweaked. It pins the upstream JAR and rewrites the recipes, progression gates, creative
tab, quest chapter and item names around it. The delta is collected under [TerraFirmaGreg](/tfgm/):

<table class="definition-list">
<tbody>
<tr><th><a href="/tfgm/differences/">What changed</a></th><td>Every modification, file by file, with the upstream behaviour it replaces.</td></tr>
<tr><th><a href="/tfgm/recipes/">Recipes</a></th><td>Every CC:T recipe is deleted and rebuilt on GregTech machines (MV → LuV), rendered in place from the release's own EMI layouts.</td></tr>
<tr><th><a href="/tfgm/turtle-upgrades/">Turtle upgrades</a></th><td>20 GregTech materials × 5 tool types = 73 <code>computercraft:tool</code> upgrades.</td></tr>
<tr><th><a href="/tfgm/quests/">Quest chapter</a></th><td>The 55-quest ComputerCraft chapter with its dependency graph.</td></tr>
<tr><th><a href="/tfgm/api/">Lua index</a></th><td>A searchable index of the CC:T 1.121.0 symbol surface, linked to these pages.</td></tr>
</tbody>
</table>

## Documentation

The reference mirrors [tweaked.cc](https://tweaked.cc/mc-1.20.x/) for CC: Tweaked 1.121.0 and is organised the same way:

<table class="definition-list">
<tbody>
<tr><th><a href="/module/_G/">Globals</a></th><td>The Lua modules available to every computer: <code>fs</code>, <code>term</code>, <code>turtle</code>, <code>rednet</code> and the rest.</td></tr>
<tr><th><a href="/library/cc.pretty/">Modules</a></th><td>The <code>cc.*</code> helper libraries bundled with CraftOS.</td></tr>
<tr><th><a href="/peripheral/computer/">Peripherals</a></th><td>Block and item peripherals such as monitors, modems, drives and speakers.</td></tr>
<tr><th><a href="/generic_peripheral/inventory/">Generic peripherals</a></th><td>Capability-based interfaces shared by many blocks, including GregTech machines.</td></tr>
<tr><th><a href="/event/char/">Events</a></th><td>The events queued by the computer, monitor and rednet APIs.</td></tr>
<tr><th><a href="/guide/gps_setup/">Guides</a></th><td>Practical walkthroughs for GPS, audio, startup files and <code>require</code>.</td></tr>
<tr><th><a href="/reference/block_details/">Reference</a></th><td>Block/item detail formats, data packs, breaking changes and the <code>/computercraft</code> command.</td></tr>
</tbody>
</table>

## Getting Started

If you have never used ComputerCraft, start with [the <code>_G</code> index](/module/_G/) and the
[`turtle` API](/module/turtle/). The upstream project also keeps
[Direwolf20's tutorials](https://www.youtube.com/watch?v=wrUHUhfCY5A) and
[Sethbling's series](https://www.youtube.com/watch?v=DSsx4VSe-Uk).

To see what this particular pack changed before you build your first computer, read
[what TerraFirmaGreg changes](/tfgm/differences/) and the [recipe set](/tfgm/recipes/).
