---
title: 机械动力联动
order: 15
---

# 机械动力联动

<VersionPill show-core />

很多机械动力方块可以被包装成 ComputerCraft 外设。上游没有对应文档，因此本页记录群峦格雷任务章节暴露的方法。

## 动能与应力

| 方块 | 方法 |
| --- | --- |
| 速度计 | `getSpeed()` —— RPM |
| 应力计 | `getStress()`、`getStressCapacity()` |
| 转速控制器 | `getTargetSpeed()`、`setTargetSpeed(rpm)` |
| 电动马达 | `getSpeed()`、`getStressCapacity()`、`setSpeed(rpm)`、`stop()` |

电动马达的 `setSpeed` 接受负数 RPM 以反转方向，同时提供通用能量外设的方法。

```lua
local motor = peripheral.wrap("right")
print(("motor: %s RPM, stress %s"):format(motor.getSpeed(), motor.getStressCapacity()))
motor.setSpeed(32)
```

## 可编程齿轮箱

可编程齿轮箱按顺序执行指令：

| 方法 | 作用 |
| --- | --- |
| `move(distance)` | 移动指定方块距离，负数反向 |
| `rotate(degrees)` | 旋转指定角度，负数反向 |
| `isRunning()` | 是否仍在执行指令 |

```lua
local gearshift = peripheral.wrap("left")
if not gearshift.isRunning() then
    gearshift.rotate(90)
end
```

## 显示链接器与辉光管

| 方块 | 方法 |
| --- | --- |
| 显示链接器 | `setCursorPos(x, y)`、`getCursorPos()`、`getSize()`、`write(text)`、`clearLine()`、`clear()`、`update()` |
| 辉光管 | `setText(text)`、`setColor(color)` |

显示链接器可以驱动告示牌、翻牌显示器以及它能定位到的任何目标。坐标从 1 开始，`(1, 1)` 是左上角。

```lua
local link = peripheral.wrap("top")
link.clear()
link.setCursorPos(1, 1)
link.write("Assembler")
link.setCursorPos(1, 2)
link.write(("%d%%"):format(progress))
link.update()
```

## 列车

列车方块是机械动力联动中最有用的一部分。

| 方块 | 方法 |
| --- | --- |
| 列车站点 | `assemble()`、`disassemble()`、`setAssemblyMode(bool)`、`isInAssemblyMode()`、`getStationName()`、`setStationName(name)`、`isTrainPresent()`、`isTrainImminent()`、`isTrainEnroute()`、`getTrainName()`、`hasSchedule()`、`getSchedule()`、`setSchedule(table)` |
| 列车信号机 | `getState()`、`isForcedRed()`、`setForcedRed(bool)`、`getSignalType()`、`cycleSignalType()` |
| 列车侦测器 | `isTrainPassing()`、`getPassingTrainName()` |

```lua
local station = peripheral.wrap("right")
if station.isTrainPresent() then
    print("at platform:", station.getTrainName())
elseif station.isTrainImminent() then
    print("arriving soon")
end
```

信号机可以通过代码强制红灯，用来把站点与红石联锁：

```lua
local signal = peripheral.wrap("left")
if station.isTrainPresent() then
    signal.setForcedRed(true)
end
```

## 包裹与物流

| 方块 | 方法 |
| --- | --- |
| 蛙港 | `getAddress()`、`setAddress(address)`、`getConfiguration()`、`setConfiguration(config)` |
| 邮箱 | `getAddress()`、`setAddress(address)`、`getConfiguration()`、`setConfiguration(config)` |
| 打包机 | `makePackage()`、`getAddress()`、`setAddress(address)`、`getPackage()` |
| 仓储发报机 | `stock(detailed?)`、`getStockItemDetail(slot)`、`requestFiltered(address)`、`list()` |
| 商店桌 | `isShop()`、`getAddress()`、`setAddress(address)`、`getPriceTagItem()`、`setPriceTagItem(item)`、`getPriceTagCount()`、`setPriceTagCount(count)`、`getWares()`、`setWares(products)` |

蛙港、邮箱和打包机同时提供通用物品栏方法，因此计算机可以检查包裹内容或取出物品。

## 黏着器

| 方法 | 作用 |
| --- | --- |
| `extend()` | 强制伸出粘性面 |
| `retract()` | 强制缩回 |
| `toggle()` | 切换状态 |

## 实用提示

- 机械动力外设是方块专属的：速度计没有马达方法。调用前用 `type(obj.method) == "function"` 判断。
- `peripheral.wrap` 的朝向相对于计算机。走网络时使用有线调制解调器的名字。
- 写显示链接器或辉光管很便宜，但需要目标立即刷新时，记得调用显示链接器的 `update()`。
- 高级外设（ME 网关、库存管理器、地质扫描仪、聊天框）见[高级外设](/zh_cn/tfgm/advanced-peripherals)；格雷 capability 接口见[格雷科技联动](/zh_cn/tfgm/integrations-gregtech)。
