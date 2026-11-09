---
title: Integrations
order: 13
---

# Integrations

<VersionPill show-core />

CC: Tweaked is most useful when it can read and drive the rest of the pack. TerraFirmaGreg exposes three large surfaces:

| Surface | How it appears in Lua | Start here |
| --- | --- | --- |
| GregTech Modern | Capability-based generic peripherals and GT-specific blocks (machines, energy storage, central monitors, turbines, covers) | [GregTech integration](/tfgm/integrations-gregtech) |
| Create | Block-specific peripherals: speedometers, display links, nixie tubes, gearshifts, trains, packages, stock tickers | [Create integration](/tfgm/integrations-create) |
| Advanced Peripherals | Dedicated blocks: ME Bridge, inventory manager, geo scanner, block reader, chat box, NBT storage, automata cores | [Advanced Peripherals](/tfgm/advanced-peripherals) |

## Wrapping a block

Every integration goes through [`peripheral`](/module/peripheral/):

```lua
local machine = peripheral.wrap("right")        -- side name
local network = peripheral.wrap("wired_modem")  -- wired network name
```

If you do not know the side, enumerate every name the computer can see and test with `pcall`:

```lua
for _, name in ipairs(peripheral.getNames()) do
    local ok, peripheralObject = pcall(peripheral.wrap, name)
    if ok and peripheralObject then
        print(name, peripheral.getType(name))
    end
end
```

GT capabilities are not advertised as a `peripheral.getType` name, so `peripheral.wrap` plus `pcall` on a method is the reliable probe.

## Reading is safe, writing is not

Most blocks expose `get*` methods and a few `set*` methods. Prefer read-only dashboards first: a computer that only reads cannot jam a production line. When you do call setters such as `setWorkingEnabled` or `setForcedRed`, wrap them so a missing method does not abort the whole program:

```lua
local function try(object, method, ...)
    if type(object[method]) ~= "function" then return nil end
    local ok, result = pcall(object[method], ...)
    if not ok then print("call failed:", method, result) end
    return ok and result or nil
end
```

The [generic peripheral reference](/generic_peripheral/inventory/) documents the capability names; the pack-specific method lists are on the two integration pages.
