---
title: 群峦格雷改动
order: 1
---

# 群峦格雷改动

<VersionPill show-core />

群峦格雷现代版并没有 fork CC: Tweaked。它把上游 JAR 当作普通依赖引入，然后把周围的一切重写：配方、进度门槛、创造模式物品栏、任务章节、物品名覆盖。本指南把这两层分开，让你能分辨“这是 CC:T 本来的样子”和“这是群峦格雷改的”。

- [群峦格雷改了什么](/zh_cn/tfgm/differences) —— 逐项列出全部差异。
- [配方](/zh_cn/tfgm/recipe-design) —— 每个 CC:T 配方的格雷版。
- [海龟升级](/zh_cn/tfgm/turtle-upgrades) —— 73 个格雷工具升级。
- [进度](/zh_cn/tfgm/progression) —— 计算机什么时候可用，代价是什么。
- [语言与文本](/zh_cn/tfgm/language) —— UTF-8 支持与语言覆盖文件。
- [高级外设](/zh_cn/tfgm/advanced-peripherals) —— 群峦格雷保留的 CC 附属，以及被移除的部分。
- [上游与版本](/zh_cn/tfgm/upstream) —— CC:T 的发布节奏与群峦格雷的位置。
- [数据流水线](/zh_cn/tfgm/data-pipeline) —— 本站的数据怎么生成。
- [整合包联动](/zh_cn/tfgm/integrations) —— 用 Lua 控制格雷机器、机械动力方块与高级外设。

::: tip 从哪里开始
如果你从没用过 ComputerCraft，先读本站镜像的 [CC:T 参考文档](/module/_G/)（英文原文）。本节只记录群峦格雷对它的**改动**。
:::
