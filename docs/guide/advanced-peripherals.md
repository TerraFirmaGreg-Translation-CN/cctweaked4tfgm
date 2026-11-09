---
title: Advanced Peripherals
order: 7
---

# Advanced Peripherals

<VersionPill show-core />

Advanced Peripherals (AP) is the CC addon TFGM keeps. Its recipes are rebuilt the same way, and a chunk of the mod is deliberately left uncraftable.

## Rebuilt recipes

<RecipeBrowser machines="assembler" />

Only the AP assembler recipes are shown above. The full list, including the shaped memory card, is on the [recipes page](/guide/recipes).

## Removed from progression

`kubejs/server_scripts/advancedperipherals/recipes.js` starts with `event.remove({ mod: 'advancedperipherals' })` and then re-adds the items above. Everything else AP registers stays deleted:

| Item | Why |
| --- | --- |
| `computer_tool` | Duplicates CC:T's own terminal interaction |
| `chunk_controller` | Chunk loading — FTB Chunks owns this in TFGM |
| `colony_integrator` | MineColonies is not in the pack |
| `rs_bridge` | Refined Storage is not in the pack (AE2 is) |
| `energy_detector` | Superseded by GT machine/energy peripherals |
| `redstone_integrator` | Deprecated in 0.10.11; CC:T's `redstone_relay` replaces it |
| `peripheral_casing` | Intermediate item, no longer needed |
| `overpowered_end_automata_core` | Only the husbandry variant was kept |

## Gate levels

| Item | Tier | Notable inputs |
| --- | --- | --- |
| Chat box | MV | wired modem, MV casing, monitor, sensors/emitters |
| Block reader | MV | LV scanner, MV sensor/emitter, amethyst lens |
| Environment detector | HV | 2000 mB biomass, HV sensor/emitter, EV circuit |
| Player detector | HV | face mask (NBT `Damage:0`), 6× GT SoC, HV field generators |
| ME bridge | HV | AE2 interfaces, fluix smart cable, engineering processor |
| Geo scanner | HV | HV prospector, red steel pick head |
| NBT storage | HV | disk drive, 16× RAM chips, item smart filter |
| Weak automata core | HV | 64× CPU chip, HV robot arm, stainless gears |
| Husbandry automata core | HV | TFC grooming stations (blue + red steel) |
| End automata core | LuV | nether star lens, quantum eyes, HSSS gears |
| Inventory manager | LuV | AE2 export bus + equal distribution card |
| Overpowered cores | IV | 6× IV circuits, HSSS gears |

::: tip ME bridge is the useful one
The quest chapter calls out the ME bridge explicitly: at HV it can emulate an ME requester that otherwise costs EV. It still consumes an AE2 channel.
:::

## Creative tab

Core-Modern's `APCreativeTabMixin` redirects `CreativeModeTab.Output.acceptAll(Collection)` inside `APCreativeTab.populateCreativeTabBuilder`, which keeps AP's pocket/turtle upgrade variants out of the AP tab. AP is otherwise untouched.
