---
title: Create integration
order: 15
---

# Create integration

<VersionPill show-core />

Many Create blocks can be wrapped as ComputerCraft peripherals. They are not documented upstream, so this page records the methods the TerraFirmaGreg quest chapter exposes.

## Kinetics and stress

| Block | Methods |
| --- | --- |
| Speedometer | `getSpeed()` — RPM |
| Stressometer | `getStress()`, `getStressCapacity()` |
| Rotation Speed Controller | `getTargetSpeed()`, `setTargetSpeed(rpm)` |
| Electric Motor | `getSpeed()`, `getStressCapacity()`, `setSpeed(rpm)`, `stop()` |

`setSpeed` on the electric motor accepts a negative RPM to reverse direction, and the block also exposes the generic energy peripheral methods.

```lua
local motor = peripheral.wrap("right")
print(("motor: %s RPM, stress %s"):format(motor.getSpeed(), motor.getStressCapacity()))
motor.setSpeed(32)
```

## Programmable gearshifts

The sequenced gearshift executes instructions one at a time:

| Method | Does |
| --- | --- |
| `move(distance)` | move by the given blocks; negative reverses |
| `rotate(degrees)` | rotate by the given degrees; negative reverses |
| `isRunning()` | whether an instruction is still running |

```lua
local gearshift = peripheral.wrap("left")
if not gearshift.isRunning() then
    gearshift.rotate(90)
end
```

## Display links and nixie tubes

| Block | Methods |
| --- | --- |
| Display Link | `setCursorPos(x, y)`, `getCursorPos()`, `getSize()`, `write(text)`, `clearLine()`, `clear()`, `update()` |
| Nixie Tube | `setText(text)`, `setColor(color)` |

The display link can drive signs, flip displays and anything else it can target. Coordinates are 1-based, with `(1, 1)` at the top left.

```lua
local link = peripheral.wrap("top")
link.clear()
link.setCursorPos(1, 1)
link.write("Assembler")
link.setCursorPos(1, 2)
link.write(("%d%%"):format(progress))
link.update()
```

## Trains

Train blocks are where the Create integration becomes genuinely useful.

| Block | Methods |
| --- | --- |
| Train Station | `assemble()`, `disassemble()`, `setAssemblyMode(bool)`, `isInAssemblyMode()`, `getStationName()`, `setStationName(name)`, `isTrainPresent()`, `isTrainImminent()`, `isTrainEnroute()`, `getTrainName()`, `hasSchedule()`, `getSchedule()`, `setSchedule(table)` |
| Train Signal | `getState()`, `isForcedRed()`, `setForcedRed(bool)`, `getSignalType()`, `cycleSignalType()` |
| Train Observer | `isTrainPassing()`, `getPassingTrainName()` |

```lua
local station = peripheral.wrap("right")
if station.isTrainPresent() then
    print("at platform:", station.getTrainName())
elseif station.isTrainImminent() then
    print("arriving soon")
end
```

Signals can be forced red from code, which is useful for interlocking a station with a redstone circuit:

```lua
local signal = peripheral.wrap("left")
if station.isTrainPresent() then
    signal.setForcedRed(true)
end
```

## Packages and logistics

| Block | Methods |
| --- | --- |
| Frogport | `getAddress()`, `setAddress(address)`, `getConfiguration()`, `setConfiguration(config)` |
| Postbox | `getAddress()`, `setAddress(address)`, `getConfiguration()`, `setConfiguration(config)` |
| Packager | `makePackage()`, `getAddress()`, `setAddress(address)`, `getPackage()` |
| Stock Ticker | `stock(detailed?)`, `getStockItemDetail(slot)`, `requestFiltered(address)`, `list()` |
| Table Cover | `isShop()`, `getAddress()`, `setAddress(address)`, `getPriceTagItem()`, `setPriceTagItem(item)`, `getPriceTagCount()`, `setPriceTagCount(count)`, `getWares()`, `setWares(products)` |

Frogports, postboxes and packagers also expose the generic inventory methods, so a computer can inspect package contents or pull items out.

## Stickers

| Method | Does |
| --- | --- |
| `extend()` | force the sticky face out |
| `retract()` | force it back |
| `toggle()` | switch state |

## Practical notes

- Create peripherals are block-specific: a speedometer does not expose motor methods. Check the method with `type(obj.method) == "function"` before calling it.
- The `side` passed to `peripheral.wrap` is relative to the computer. For a network, use the wired modem's name.
- Writing to a display link or nixie tube is cheap, but call `update()` on the display link when you want the target refreshed immediately.
- For Advanced Peripherals (ME Bridge, inventory manager, geo scanner, chat box), see [Advanced Peripherals](/tfgm/advanced-peripherals); for the GT capability surface, see [GregTech integration](/tfgm/integrations-gregtech).
