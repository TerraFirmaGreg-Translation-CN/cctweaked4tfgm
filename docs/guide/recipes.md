---
title: Recipes
order: 3
---

# Recipes

<VersionPill show-core />

Every CC:T recipe in the pack is a GregTech recipe. Core components (cable, computers, turtles) are assembled; peripherals are shaped GT recipes; disks come out of a chemical bath in all 16 dye colours.

<RecipeBrowser show-removals />

## Voltage map

<TierLegend />

| Item | Machine | Tier | EU/t | Duration |
| --- | --- | --- | --- | --- |
| Networking cable ×2 | Assembler | MV | 120 | 80t |
| Computer | Assembler | MV | 120 | 1200t |
| Advanced computer | Assembler | HV | 480 | 1200t |
| Turtle | Assembler | HV | 480 | 1200t |
| Advanced turtle | Assembler | EV | 1920 | 1200t |
| Redstone relay | Assembler | MV | 120 | 1200t |
| Monitor | GT shaped | MV | — | — |
| Advanced monitor | GT shaped | HV | — | — |
| Pocket computer | GT shaped | HV | — | — |
| Advanced pocket computer | GT shaped | EV | — | — |
| Disk (×16 colours) | Chemical bath | ULV | 7 | 20t |

Assembler recipes all use **circuit 4**, which means they conflict with nothing else on that circuit slot.

## Design notes

**The cable is the bottleneck.** Two quartzite rods plus two AE2 quartz fibres per two cables, in a 288 mB redstone bath at MV. Every other recipe consumes cable, so cable throughput sets your computer build rate — and quartzite is a TFC rock, not a GT ore.

**AE2 processors are the second gate.** Calculation processors appear in monitors, modems, disk drives, pocket computers and the redstone relay. CC therefore lands after AE2 automation, not before.

**Monitors need GT display parts.** `gtceu:computer_monitor_cover` is a GregTech cover, which ties the whole CC line to GregTech machine progression rather than to vanilla glass and stone.

**Disks are cheap and dyed.** The chemical bath takes an AE2 blank pattern plus 288 mB of the matching **TFC** dye (`tfc:*_dye`), so disk colouring uses TFC's dye chain, not vanilla dyes.

**Pocket computers are HV/EV.** They are deliberately not an early-game convenience item: AE2 wireless receiver, an AE2 terminal, a GT battery and an emitter.

::: tip Recipe conflicts
Assembler programs are keyed on (inputs, circuit, EU/t). If a CC recipe disappears from EMI after a GT update, check whether another mod claimed the same circuit-4 combination.
:::
