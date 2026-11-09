---
title: Lua API
order: 12
---

# Lua API

<VersionPill show-core />

This is the complete CC:T 1.121.0 Lua surface — 658 symbols in 95 groups — mirroring `tweaked.cc`'s own index. TFGM changes none of it: no function is added, removed or re-signatured. The point of this page is to give you a version-pinned index that matches the JAR in the pack, with links to the exact upstream page.

<ApiIndex />

## How TFGM exposes GregTech to Lua

CC:T cannot know about GregTech; GregTech registers capabilities and CC:T wraps them. From a computer, any GT block with the relevant capability is a peripheral:

```lua
local ok, machine = pcall(peripheral.wrap, "minecraft:blast_furnace_1")
if ok and machine then
    print(machine.getProgress(), machine.getMaxProgress())
    machine.setWorkingEnabled(false)
end
```

| Capability | Methods |
| --- | --- |
| Machine | `getProgress`, `getMaxProgress`, `isActive`, `isWorkingEnabled`, `setWorkingEnabled`, `setSuspendAfterFinish` |
| Energy storage | `getEnergyStored`, `getEnergyCapacity`, `getInputPerSec`, `getOutputPerSec` |
| Inventory | `size`, `list`, `getItemDetail`, `pushItems`, `pullItems` |
| Fluid | `tanks`, `pushFluid`, `pullFluid` |
| Central monitor | `getGroups`, module text/image accessors |
| Monitor cover | `setBufferedText`, `parsePlaceholders` |
| Large turbine | `hasRotor`, `getRotorSpeed`, `getTotalEfficiency`, `getCurrentProduction` |

## Version pinning

The index is generated from `https://tweaked.cc/mc-1.20.x/index.json` for the commit that shipped **1.121.0**, and every entry URL is rewritten to the `mc-1.20.x` prefix. If TFGM bumps CC:T, regenerate with:

```bash
node scripts/build-cc-index.mjs --cc-version <new-version>
```

`verify-data.mjs` fails when `cc-index.json`'s `ccVersion` disagrees with the `ccTweaked.version` in `meta.json`, so the two can never drift apart silently.
