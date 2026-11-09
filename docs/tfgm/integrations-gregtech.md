---
title: GregTech integration
order: 14
---

# GregTech integration

<VersionPill show-core />

GregTech Modern does not register named peripherals. It exposes *capabilities* on blocks, and CC: Tweaked wraps those capabilities as generic peripherals. Any GT machine, multiblock controller, battery buffer or turbine controller can therefore be a peripheral.

## Machines and multiblock controllers

Wrap the block by side or network name. All GT machines expose the progress surface:

| Method | Returns |
| --- | --- |
| `getProgress()` | current recipe progress, in ticks |
| `getMaxProgress()` | total recipe duration, in ticks |
| `isActive()` | whether a recipe is currently running |
| `isWorkingEnabled()` | whether working is enabled |
| `setWorkingEnabled(enabled)` | switch working on/off |
| `setSuspendAfterFinish(suspend)` | stop the machine after the current recipe |

```lua
local machine = peripheral.wrap("right")
if machine and machine.getProgress then
    while true do
        local progress = machine.getProgress()
        local total = machine.getMaxProgress()
        print(("%d / %d ticks"):format(progress, total))
        sleep(1)
    end
end
```

## Energy storage

Battery buffers, substations and other GT energy blocks expose:

| Method | Returns |
| --- | --- |
| `getEnergyStored()` | stored energy in EU |
| `getEnergyCapacity()` | maximum energy in EU |
| `getInputPerSec()` | current input rate in EU/t |
| `getOutputPerSec()` | current output rate in EU/t |

```lua
local buffer = peripheral.wrap("back")
local stored, capacity = buffer.getEnergyStored(), buffer.getEnergyCapacity()
print(("EU: %d / %d (%.1f%%)"):format(stored, capacity, stored / capacity * 100))
```

## Inventories and fluids

Any GT block with automation-accessible item or fluid storage also exposes the generic inventory / fluid tank methods:

| Surface | Methods |
| --- | --- |
| Items | `size()`, `list()`, `getItemDetail(slot)`, `pushItems(to, from, limit)`, `pullItems(from, fromSlot, limit)` |
| Fluids | `tanks()`, `pushFluid(to, limit)`, `pullFluid(from, limit)` |

These are the same methods documented under [generic peripherals](/generic_peripheral/inventory/). A computer with a wired modem and a network cable can use this to move items between a GT machine and a chest, or to build a cheap item-count dashboard.

## Large turbines

Wrapping any large turbine controller gives you rotor telemetry:

| Method | Returns |
| --- | --- |
| `hasRotor()` | whether a rotor is installed |
| `getRotorSpeed()` | current rotor speed in RPM |
| `getMaxRotorHolderSpeed()` | maximum rotor speed in RPM |
| `getTotalEfficiency()` | turbine efficiency |
| `getCurrentProduction()` | current output in EU/t |
| `getOverclockVoltage()` | maximum output voltage |
| `getRotorDurabilityPercent()` | rounded rotor durability |

Use it to avoid burning fuel beyond the rotor's rating, or to shut the turbine down when durability gets low:

```lua
local turbine = peripheral.wrap("right")
if turbine.hasRotor() and turbine.getRotorDurabilityPercent() < 10 then
    turbine.setWorkingEnabled(false)
    print("Rotor worn out — turbine stopped")
end
```

## Central monitors and display covers

The GT central monitor is a multiblock monitor built from a central monitor, GT monitor blocks, a data access hatch and an energy hatch. Wrapped as a peripheral, it exposes groups and modules:

| Method | Returns / does |
| --- | --- |
| `getGroups()` | table of monitor groups |
| `group.getName()` | group name |
| `group.getModule()` | the group's module |
| `module.getType()` | `"text"`, `"image"` or `"none"` |
| `module.getCurrentText()` / `setPlaceholderText(text)` | read / write text placeholders |
| `module.getScale()` / `setScale(scale)` | read / write text scale |
| `module.getImageUrl()` / `setImageUrl(url)` | read / write image module URL |

The data monitor cover exposes a smaller surface on the machine it is attached to:

| Method | Does |
| --- | --- |
| `setBufferedText(face, line, text)` | set one line of the cover's text buffer |
| `parsePlaceholders(face, text)` | resolve GT placeholders in a string |

For most packs a normal CC [monitor](/peripheral/monitor/) is easier: it supports colour, touch and the full `monitor` API. The GT central monitor is worth using only when the layout is already built around GT display blocks.

## Practical notes

- The GT machine must be adjacent to the computer, or reachable over a wired modem network.
- `setWorkingEnabled(false)` does not cancel the current recipe unless you also call `setSuspendAfterFinish(true)`.
- A multiblock controller exposes the progress surface, not the internal hatches. Wrap the controller, not a casing.
- Recipe and progression costs are in the [TFGM recipe set](/tfgm/recipes/); this page only covers the Lua surface.
