---
title: 海龟升级
order: 4
---

# 海龟升级

<VersionPill show-core />

CC:T 自带六种原版工具升级（钻石剑/镐/斧/铲/锄 + 工作台），外加无线调制解调器和扬声器。群峦格雷为**每种格雷材料 × 每种工具类型**各加一个升级，由 `kubejs/server_scripts/computer_craft/data.js` 生成：

```js
const TURTLE_TOOL_TYPES = [ GTToolType.SWORD, GTToolType.PICKAXE, GTToolType.AXE, GTToolType.SHOVEL, GTToolType.HOE ]
forEachMaterial(material => { /* ... */ event.addJson(
	`computercraft:computercraft/turtle_upgrades/${material.getName()}_${type.name}`, json) })
```

## 升级矩阵

<TurtleMatrix />

## 生成的数据文件

每个格子都会向 CC:T 的升级注册表写入一个 JSON。点击上面任意材料行，或看这个形状：

```json
{
  "type": "computercraft:tool",
  "item": "gtceu:steel_pickaxe",
  "adjective": "upgrade.minecraft.diamond_pickaxe.adjective",
  "allowEnchantments": true,
  "consumeDurability": "always",
  "breakable": "computercraft:turtle_sword_harvestable"
}
```

几个值得注意的点：

- **只有剑、铲、锄设置 `breakable`。** 群峦格雷复用 CC:T 自己的方块标签，而 CC:T 只为这三类定义了升级专用的采集标签。
- **形容词复用原版键。** 钢镐海龟同样叫“Mining Turtle”，与钻石镐一致——群峦格雷没有为每种材料新增形容词。
- **`consumeDurability: "always"`** 表示格雷工具的耐久真的会被消耗，挖矿会磨工具。配合 `allowEnchantments`，附魔的格雷工具依然生效。

## TFC 作物收割

`kubejs/server_scripts/computer_craft/tags.js` 扩展了 CC:T 的锄头标签：

```js
event.add('computercraft:turtle_hoe_harvestable', '#tfc:mineable_with_sharp_tool')
```

TFC 把作物收割建模为“锐器”而非“锄头”，这一行才让格雷锄头升级真的能收割 TFC 作物。

## CC:T 升级 API 变更的影响

CC:T 1.121.0 重写了升级的 NBT 格式，改为保留所装备的物品（`RightUpgradeItem` / `UpgradeInfo`）。对群峦格雷存档的影响：

- 在 1.121.0 之前装好格雷工具的海龟仍可用，但会丢失存储的工具，需要重新装一次升级。
- 群峦格雷的升级 ID 是 `computercraft:<material>_<type>`，不受格式变化影响。
- 施加升级的配方（`computercraft:impostor_shaped`，模式 `#T`）会把物品自动写进升级数据。

::: warning 不在创造模式物品栏
海龟——无论是否升级——都不会出现在 CC 创造标签页（见[群峦格雷改了什么](/zh_cn/guide/differences#创造模式物品栏)）。合成仍然正常。
:::
