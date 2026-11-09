---
title: 任务
order: 11
---

# 任务

<VersionPill show-core />

群峦格雷任务书的 CC 章节（`config/ftbquests/quests/chapters/cc.snbt`，章节 id `1A6D6B70EC13DDC6`）在 0.12.9 重写。59 个节点、55 个任务，覆盖 CC:T、高级外设、More Red 集束线缆、机械动力外设以及格雷自己的外设接口。

<QuestList />

## 章节结构

| 分区 | 任务数 | 内容 |
| --- | --- | --- |
| 欢迎 | 1 | “你遇见了 Luna。准备好迎接 Lua。” |
| 变体 | 3 | 高级计算机、便携机、海龟 |
| 外设入门 | 2 | 什么是外设、`wrap()` |
| 通用外设 | 4 | 物品栏、流体罐、电池 |
| CC:T 外设 | 10 | 显示器、扬声器、软盘驱动器、打印机、红石继电器、集束线缆、计算机、调制解调器 |
| 高级外设 | 8 | NBT 存储、地理扫描仪、ME 网关、库存管理器、方块读取器、环境监测仪、聊天方块、玩家探测器 |
| 自动化核心 | 4 | 弱、畜牧、末地、高级 |
| 机械动力外设 | 12 | 贴纸、速度表、显示链接、辉光管、电机、序列齿轮箱、列车方块、邮筒、蛙港、打包机、库存行情板 |
| 格雷外设 | 6 | 中央监控器、监控器盖板、大型涡轮、任意格雷机器、能量存储 |

## 章节里嵌入的链接

任务书在章节里放了三个书图标链接：

- `https://tweaked.cc/` —— CC:T 文档
- `https://docs.advanced-peripherals.de/latest/` —— AP 文档
- 格雷现代版中央监控器页面

## 格雷对 CC 的回答

格雷不注册离散的外设。它暴露的是*能力（capability）*，由 CC:T 通用地包装：

```lua
local machine = peripheral.wrap("minecraft:blast_furnace_1")
print(machine.getProgress() .. " / " .. machine.getMaxProgress())
print(machine.isActive())
```

章节列出了支持的方法组：机器上的 `getProgress`、`getMaxProgress`、`isActive`、`isWorkingEnabled`、`setWorkingEnabled`、`setSuspendAfterFinish`；能量存储上的 `getEnergyStored`、`getEnergyCapacity`、`getInputPerSec`、`getOutputPerSec`。

中央监控器任务直接说了实话：“如果你有 ComputerCraft，其实没有理由真的去用中央监控器。”

## 在任务书中打开

<QuestBookLink />
