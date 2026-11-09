---
title: Quests
order: 11
---

# Quests

<VersionPill show-core />

The CC chapter of the TerraFirmaGreg quest book (`config/ftbquests/quests/chapters/cc.snbt`, chapter id `1A6D6B70EC13DDC6`) was rewritten in 0.12.9. It has 55 quests in 59 nodes, covering CC:T, Advanced Peripherals, More Red bundled cables, Create peripherals and GregTech's own peripheral surface.

<QuestList />

## Chapter structure

| Section | Quests | Content |
| --- | --- | --- |
| Welcome | 1 | "You've met Luna. Prepare for Lua." |
| Variants | 3 | Advanced computers, pocket computers, turtles |
| Peripherals intro | 2 | What a peripheral is, `wrap()` |
| Generic peripherals | 4 | Inventory, fluid tank, battery |
| CC:T peripherals | 10 | Monitor, speaker, disk drive, printer, redstone relay, bundled cable, computer, modems |
| Advanced Peripherals | 8 | NBT storage, geo scanner, ME bridge, inventory manager, block reader, environment detector, chat box, player detector |
| Automata cores | 4 | Weak, husbandry, end, overpowered |
| Create peripherals | 12 | Sticker, speedometer, display link, nixie tube, motor, gearshift, train blocks, postbox, frogport, packager, stock ticker |
| GregTech peripherals | 6 | Central monitor, monitor cover, large turbine, any GT machine, energy storage |

## Links embedded in the chapter

The quest book puts three book icons in the chapter, linking out:

- `https://tweaked.cc/` — CC:T documentation
- `https://docs.advanced-peripherals.de/latest/` — AP documentation
- GT Modern's Central Monitor page

## GregTech's answer to CC

GregTech does not register discrete peripherals. It exposes *capabilities*, which CC:T wraps generically:

```lua
local machine = peripheral.wrap("minecraft:blast_furnace_1")
print(machine.getProgress() .. " / " .. machine.getMaxProgress())
print(machine.isActive())
```

The chapter lists the supported method groups: `getProgress`, `getMaxProgress`, `isActive`, `isWorkingEnabled`, `setWorkingEnabled`, `setSuspendAfterFinish` on machines; `getEnergyStored`, `getEnergyCapacity`, `getInputPerSec`, `getOutputPerSec` on energy storage.

The Central Monitor quest says the quiet part out loud: "There's no real reason to actually use Central Monitors if you have ComputerCraft."

## Open in the quest book

<QuestBookLink />
