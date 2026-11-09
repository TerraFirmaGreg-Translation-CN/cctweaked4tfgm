---
title: 格雷科技联动
order: 14
---

# 格雷科技联动

<VersionPill show-core />

格雷科技现代版不注册具名外设，而是在方块上暴露 *capability*，CC: Tweaked 再把 capability 包装成通用外设。因此任何格雷机器、多方块控制器、电池箱或涡轮控制器都可以成为外设。

## 机器与多方块控制器

按朝向或有线网络名包装方块。所有格雷机器都提供进度接口：

| 方法 | 返回 |
| --- | --- |
| `getProgress()` | 当前配方进度（刻） |
| `getMaxProgress()` | 配方总时长（刻） |
| `isActive()` | 当前是否正在运行配方 |
| `isWorkingEnabled()` | 是否启用了工作状态 |
| `setWorkingEnabled(enabled)` | 开启 / 关闭工作 |
| `setSuspendAfterFinish(suspend)` | 当前配方完成后停止 |

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

## 能量存储

电池箱、蓄能变电站等能量方块提供：

| 方法 | 返回 |
| --- | --- |
| `getEnergyStored()` | 已存储能量（EU） |
| `getEnergyCapacity()` | 最大容量（EU） |
| `getInputPerSec()` | 当前输入速率（EU/t） |
| `getOutputPerSec()` | 当前输出速率（EU/t） |

```lua
local buffer = peripheral.wrap("back")
local stored, capacity = buffer.getEnergyStored(), buffer.getEnergyCapacity()
print(("EU: %d / %d (%.1f%%)"):format(stored, capacity, stored / capacity * 100))
```

## 物品栏与流体

任何允许自动化访问物品或流体的格雷方块，同时提供通用物品栏 / 流体接口：

| 接口 | 方法 |
| --- | --- |
| 物品 | `size()`、`list()`、`getItemDetail(slot)`、`pushItems(to, from, limit)`、`pullItems(from, fromSlot, limit)` |
| 流体 | `tanks()`、`pushFluid(to, limit)`、`pullFluid(from, limit)` |

这些方法与[通用外设](/generic_peripheral/inventory/)一致。计算机接上有线调制解调器和网络线缆后，可以在格雷机器与箱子之间搬运物品，或者做一个廉价的数量仪表盘。

## 大型涡轮

包装任意大型涡轮控制器可以获得转子遥测：

| 方法 | 返回 |
| --- | --- |
| `hasRotor()` | 是否安装了转子 |
| `getRotorSpeed()` | 当前转速（RPM） |
| `getMaxRotorHolderSpeed()` | 最大转速（RPM） |
| `getTotalEfficiency()` | 涡轮效率 |
| `getCurrentProduction()` | 当前输出（EU/t） |
| `getOverclockVoltage()` | 最大输出电压 |
| `getRotorDurabilityPercent()` | 转子耐久百分比（取整） |

可以用它避免超出转子额定值燃烧燃料，或在耐久过低时停机：

```lua
local turbine = peripheral.wrap("right")
if turbine.hasRotor() and turbine.getRotorDurabilityPercent() < 10 then
    turbine.setWorkingEnabled(false)
    print("Rotor worn out — turbine stopped")
end
```

## 中央监控器与显示覆盖板

格雷中央监控器是由中央监控器、格雷显示器方块、数据访问仓和能源仓搭成的多方块显示器。包装为外设后，它暴露监控组与模块：

| 方法 | 返回 / 作用 |
| --- | --- |
| `getGroups()` | 监控器组表 |
| `group.getName()` | 组名 |
| `group.getModule()` | 组的模块 |
| `module.getType()` | `"text"`、`"image"` 或 `"none"` |
| `module.getCurrentText()` / `setPlaceholderText(text)` | 读取 / 写入文本占位符 |
| `module.getScale()` / `setScale(scale)` | 读取 / 写入文字缩放 |
| `module.getImageUrl()` / `setImageUrl(url)` | 读取 / 写入图片 URL |

数据监控覆盖板则在所贴机器上暴露更小的接口：

| 方法 | 作用 |
| --- | --- |
| `setBufferedText(face, line, text)` | 设置覆盖板某一行文本 |
| `parsePlaceholders(face, text)` | 解析字符串中的格雷占位符 |

大多数情况下普通 CC [显示器](/peripheral/monitor/) 更简单：它有颜色、触摸和完整的 `monitor` API。只有布局已经围绕格雷显示方块搭建时，中央监控器才值得使用。

## 实用提示

- 格雷机器必须与计算机相邻，或者通过有线调制解调器网络访问。
- `setWorkingEnabled(false)` 不会取消当前配方，除非同时调用 `setSuspendAfterFinish(true)`。
- 多方块控制器暴露的是进度接口，不是内部仓室。包装控制器，不要包装外壳。
- 配方与进度成本见 [TFGM 配方表](/zh_cn/tfgm/recipes/)；本页只讲 Lua 接口。
