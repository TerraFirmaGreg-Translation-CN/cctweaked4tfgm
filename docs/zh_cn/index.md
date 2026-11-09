---
title: 群峦格雷的 CC: Tweaked
order: 0
---

<h1 class="home-logo"><picture><source media="(prefers-color-scheme: dark)" srcset="/logo-darkmode-d172fd76.png" /><source media="(prefers-color-scheme: light)" srcset="/logo-42c40e20.png" /><img src="/logo-42c40e20.png" alt="CC: Tweaked" /></picture></h1>

CC: Tweaked 是一个为 Minecraft 加入可编程计算机、海龟与大量外设的模组。它继承自广受喜爱的
[ComputerCraft](https://github.com/dan200/ComputerCraft)，并在性能、稳定性与新功能上继续发展。

本站是 **群峦格雷现代版** 携带的 CC: Tweaked 文档副本。参考内容锁定到整合包实际安装的 JAR；群峦格雷的改动单独记录在
[TerraFirmaGreg](/zh_cn/tfgm/) 下，并只在影响对应页面时插入。

<VersionPill show-core />

## 特性

CC: Tweaked 的计算机使用 [Lua 语言](https://www.lua.org/)编程，提供编写代码和自动化 Minecraft 世界所需的全部工具。
[全局函数](/module/_G/) 一节记录了计算机可用的全部 API（英文原文）。

<img src="/basic-terminal-45a33440.png" alt="一台打开的 ComputerCraft 终端，准备好编写程序。" class="big-image" />

计算机虽然强大，却不能移动。*海龟* 解决了这一点：它们可以移动、破坏和放置方块、挥剑保护你免受僵尸伤害，或者执行你编写的任何逻辑。详见 [`turtle` API](/module/turtle/)（英文原文）。

<img src="/turtle-1b1e3370.png" alt="一只正在 Minecraft 中挖掘隧道的海龟。" class="big-image" />

并非所有问题都能用镐解决，所以 CC: Tweaked 还提供了大量 [外设](/peripheral/computer/)：用 [扬声器](/peripheral/speaker/) 演奏音乐，
在 [显示器](/peripheral/monitor/) 上显示文字或图像，用 [调制解调器](/peripheral/modem/) 把计算机连成网络，等等。

计算机还可以与箱子等容器交互，让你搭建物品与库存管理系统。

<img src="/peripherals-d5df11cc.png" alt="计算机读取箱子内容并显示在显示器上。" class="big-image" />

## TerraFirmaGreg

本参考副本锁定到 **TFGM 0.13.18** 与 CC: Tweaked 1.121.0。群峦格雷围绕上游模组重写了配方、进度门槛，并加入自己的外设；
这些差异记录在 [TerraFirmaGreg](/zh_cn/tfgm/) 下。

<table class="definition-list">
<tbody>
<tr><th><a href="/zh_cn/tfgm/differences/">群峦格雷改了什么</a></th><td>配方、创造模式物品栏、任务章节、语言覆盖，以及两处上游 API 变更。</td></tr>
<tr><th><a href="/zh_cn/tfgm/recipes/">配方表</a></th><td>全部 54 个 CC / AP 配方，直接使用发行版的 EMI 布局渲染。</td></tr>
<tr><th><a href="/zh_cn/tfgm/turtle-upgrades/">海龟升级</a></th><td>20 种材料 × 5 种工具，共 73 个格雷工具升级。</td></tr>
<tr><th><a href="/zh_cn/tfgm/quests/">任务章节</a></th><td>55 个 ComputerCraft 任务及其依赖图。</td></tr>
<tr><th><a href="/zh_cn/tfgm/api/">Lua 索引</a></th><td>CC:T 1.121.0 全部符号的可搜索索引，指向本机镜像的文档页。</td></tr>
<tr><th><a href="/zh_cn/tfgm/integrations/">整合包联动</a></th><td>用 Lua 控制格雷机器、机械动力方块与高级外设。</td></tr>
</tbody>
</table>

## 文档

参考内容按 [tweaked.cc](https://tweaked.cc/mc-1.20.x/) 的结构组织，对应 CC: Tweaked 1.121.0：

<table class="definition-list">
<tbody>
<tr><th><a href="/module/_G/">全局函数</a></th><td>每台计算机都可用的 Lua 模块：<code>fs</code>、<code>term</code>、<code>turtle</code>、<code>rednet</code> 等。</td></tr>
<tr><th><a href="/library/cc.pretty/">模块</a></th><td>CraftOS 自带的 <code>cc.*</code> 辅助库。</td></tr>
<tr><th><a href="/peripheral/computer/">外设</a></th><td>显示器、调制解调器、磁盘驱动器、扬声器等方块与物品外设。</td></tr>
<tr><th><a href="/generic_peripheral/inventory/">通用外设</a></th><td>许多方块共享的 capability 接口，包括格雷机器。</td></tr>
<tr><th><a href="/event/char/">事件</a></th><td>计算机、显示器与 rednet 产生的事件。</td></tr>
<tr><th><a href="/guide/gps_setup/">指南</a></th><td>GPS、音频、启动文件与 <code>require</code> 的实操教程。</td></tr>
<tr><th><a href="/reference/block_details/">参考</a></th><td>方块/物品详情格式、数据包、不兼容变更与 <code>/computercraft</code> 命令。</td></tr>
</tbody>
</table>

## 入门

虽然 ComputerCraft 对经验丰富的程序员和新手都很友好，但入门仍可能让人望而生畏。幸好有不少优秀的教程：

- [Direwolf20 的 ComputerCraft 教程](https://www.youtube.com/watch?v=wrUHUhfCY5A)
- [Sethbling 的 ComputerCraft 系列](https://www.youtube.com/watch?v=DSsx4VSe-Uk)
- [Lyqyd 的 Computer Basics I](https://ccf.squiddev.cc/forums2/index.php?/topic/15033-computer-basics-i/)

熟悉模组之后，侧栏和[文档](/module/_G/)提供了各个 API 与外设的详细说明。在合成第一台计算机之前，先读
[群峦格雷改了什么](/zh_cn/tfgm/differences/)和[配方表](/zh_cn/tfgm/recipes/)。

## 社区

如果你需要帮助、想展示最新作品，或者只是想聊聊 ComputerCraft，可以访问 GitHub discussions，或加入 EsperNet 上的
`#computercraft` IRC 频道。

## 参与

CC: Tweaked 托管在 [GitHub](https://github.com/cc-tweaked/CC-Tweaked/) 上。有想法、反馈或 bug，请
[创建 issue](https://github.com/cc-tweaked/CC-Tweaked/issues/new/choose)。本站的镜像与群峦格雷改动则维护在
[cctweaked4tfgm](https://github.com/TerraFirmaGreg-Translation-CN/cctweaked4tfgm)。
