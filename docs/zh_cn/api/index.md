---
title: Lua 接口
order: 12
---

# Lua 接口

<VersionPill show-core />

这里是 CC:T 1.121.0 完整的 Lua 接口——95 组、658 个符号——镜像自 `tweaked.cc` 自己的索引。群峦格雷没有改动其中任何一项：没有新增、删除或改签名的函数。本页的价值在于提供一个与整合包内 JAR **精确对应**的版本锁定索引，并链接到上游的确切页面。

<ApiIndex />

## 群峦格雷如何把格雷暴露给 Lua

CC:T 不可能知道格雷的存在；格雷注册能力，CC:T 负责包装。在计算机里，任何带相应能力的格雷方块都是外设：

```lua
local ok, machine = pcall(peripheral.wrap, "minecraft:blast_furnace_1")
if ok and machine then
    print(machine.getProgress(), machine.getMaxProgress())
    machine.setWorkingEnabled(false)
end
```

| 能力 | 方法 |
| --- | --- |
| 机器 | `getProgress`、`getMaxProgress`、`isActive`、`isWorkingEnabled`、`setWorkingEnabled`、`setSuspendAfterFinish` |
| 能量存储 | `getEnergyStored`、`getEnergyCapacity`、`getInputPerSec`、`getOutputPerSec` |
| 物品栏 | `size`、`list`、`getItemDetail`、`pushItems`、`pullItems` |
| 流体 | `tanks`、`pushFluid`、`pullFluid` |
| 中央监控器 | `getGroups`、模块文本/图像访问器 |
| 监控器盖板 | `setBufferedText`、`parsePlaceholders` |
| 大型涡轮 | `hasRotor`、`getRotorSpeed`、`getTotalEfficiency`、`getCurrentProduction` |

## 版本锁定

索引由发行 **1.121.0** 的那次提交的 `https://tweaked.cc/mc-1.20.x/index.json` 生成，每条 URL 都改写到 `mc-1.20.x` 前缀。群峦格雷升级 CC:T 后重新生成：

```bash
node scripts/build-cc-index.mjs --cc-version <新版本>
```

当 `cc-index.json` 的 `ccVersion` 与 `meta.json` 里的 `ccTweaked.version` 不一致时，`verify-data.mjs` 会失败，所以两者无法悄悄漂移。
