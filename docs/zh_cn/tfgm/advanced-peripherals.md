---
title: 高级外设
order: 7
---

# 高级外设

<VersionPill show-core />

高级外设（Advanced Peripherals，AP）是群峦格雷保留的 CC 附属。它的配方同样被重写，而且一部分内容被刻意设为不可合成。

## 重建的配方

<RecipeBrowser machines="assembler" />

上面只显示 AP 的组装机配方。完整列表（含工作台合成的记忆卡）见[配方页](/zh_cn/tfgm/recipe-design)。

## 从进度中移除

`kubejs/server_scripts/advancedperipherals/recipes.js` 以 `event.remove({ mod: 'advancedperipherals' })` 开头，然后只重新添加上面那些物品。AP 注册的其余内容保持删除状态：

| 物品 | 原因 |
| --- | --- |
| `computer_tool` | 与 CC:T 自身的终端交互重复 |
| `chunk_controller` | 区块加载在群峦格雷里归 FTB Chunks 管 |
| `colony_integrator` | 整合包没有 MineColonies |
| `rs_bridge` | 整合包没有精致存储（有的是 AE2） |
| `energy_detector` | 被格雷机器/能量外设取代 |
| `redstone_integrator` | 0.10.11 已弃用；由 CC:T 的 `redstone_relay` 接替 |
| `peripheral_casing` | 中间产物，不再需要 |
| `overpowered_end_automata_core` | 只保留了畜牧版本 |

## 门槛

| 物品 | 等级 | 关键输入 |
| --- | --- | --- |
| 聊天方块 | MV | 有线调制解调器、MV 机壳、显示器、传感器/发射器 |
| 方块读取器 | MV | LV 扫描仪、MV 传感器/发射器、紫水晶透镜 |
| 环境监测仪 | HV | 2000 mB 生物质、HV 传感器/发射器、EV 电路 |
| 玩家探测器 | HV | 面罩（NBT `Damage:0`）、6 个格雷 SoC、HV 场发生器 |
| ME 网关 | HV | AE2 接口、fluix 智能线缆、工程处理器 |
| 地理扫描仪 | HV | HV 探矿器、红钢镐头 |
| NBT 存储器 | HV | 软盘驱动器、16 个 RAM 芯片、物品智能过滤器 |
| 弱自动化核心 | HV | 64 个 CPU 芯片、HV 机械臂、不锈钢齿轮 |
| 畜牧自动化核心 | HV | TFC 饲养站（蓝钢 + 红钢） |
| 末地自动化核心 | LuV | 下界之星透镜、量子之眼、HSSS 齿轮 |
| 库存管理器 | LuV | AE2 输出总线 + 均分卡 |
| 高级核心 | IV | 6 个 IV 电路、HSSS 齿轮 |

::: tip ME 网关最有价值
任务章节专门点出 ME 网关：在 HV 就能模拟出原本要 EV 的 ME 请求器。它仍然占用一个 AE2 频道。
:::

## 创造模式物品栏

Core-Modern 的 `APCreativeTabMixin` 重定向了 `APCreativeTab.populateCreativeTabBuilder` 里的 `CreativeModeTab.Output.acceptAll(Collection)`，把 AP 的便携机/海龟升级变体排除在 AP 标签页之外。AP 的其余部分不受影响。
