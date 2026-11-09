---
title: 群峦格雷改了什么
order: 2
---

# 群峦格雷改了什么

<VersionPill show-core />

群峦格雷的修改集中在四处。除创造模式物品栏的 mixin 外，没有任何一处改动 CC:T 的字节码。

| 层 | 文件 | 作用 |
| --- | --- | --- |
| 配方 | `kubejs/server_scripts/computer_craft/recipes.js` | 删除除打印纸/打印书外的全部 CC:T 配方，其余改用格雷机器重建 |
| 数据 | `kubejs/server_scripts/computer_craft/data.js` | 为每种格雷材料 × 每种工具类型生成一个 `computercraft:tool` 升级 |
| 标签 | `kubejs/server_scripts/computer_craft/tags.js` | 猪灵标签、TFC 锄头可采集标签 |
| 客户端 | Core-Modern 的 `ModRegistryMixin` | 取消 `ModRegistry.addTurtle`，让海龟不进入创造模式物品栏 |

## 配方删除

第一条语句就是整包清除：

```js
event.remove({
	not: [
		{ id: 'computercraft:printed_pages' },
		{ id: 'computercraft:printed_book' },
	], mod: 'computercraft'
});
```

只有打印书一条线保留了原版配方。其余——计算机、海龟、显示器、驱动器、调制解调器、打印机、扬声器、继电器——都在下面重新添加。

## 实际配方集

<RecipeBrowser />

## 什么**没有**被改

- **服务端配置。** `defaultconfigs/computercraft-server.toml` 与 CC:T 默认值逐键一致。没有性能调优，也没有在 CC:T 已有规则之外额外封锁 HTTP。详见[配置](/zh_cn/tfgm/configuration)。
- **Java 代码。** JAR 是原版。唯一的挂钩是创造模式物品栏 mixin。
- **Lua 接口。** 每个 `turtle`、`peripheral`、`rednet`、`fs` 函数的行为都与上游文档完全一致。

## 创造模式物品栏

群峦格雷没有自带海龟模型：`ComputerCraft Greg Refreshed` 资源包（CLIENT 侧，117 个 CC 贴图/模型文件）里没有海龟方块模型。为了避免物品栏出现无贴图条目，Core-Modern 混入了 `dan200.computercraft.shared.ModRegistry`：

```java
@Inject(method = "addTurtle", at = @At("HEAD"), cancellable = true)
private static void tfg$removeTurtleStream(CreativeModeTab.Output out, TurtleItem turtle, CallbackInfo ci) {
    ci.cancel();
}
```

同一提交还配了 `APCreativeTabMixin`，重定向 `CreativeModeTab.Output.acceptAll(Collection)`，把高级外设的海龟/便携机变体也从 AP 标签页里去掉。

**海龟仍然可以合成。** 它们只是不出现在创造模式菜单里，在世界中使用 CC:T 自己的贴图渲染。

::: warning mixin 必须注册
该 mixin 必须列在 `tfg.mixins.json`（`common.cc_tweaked.ModRegistryMixin`）。如果未来 CC:T 重命名 `addTurtle`，注入器会在加载时失败、Core-Modern 拒绝启动——这是有意为之：静默失效会把无贴图海龟放回物品栏。
:::
