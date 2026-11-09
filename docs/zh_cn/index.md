---
title: 群峦格雷的 CC: Tweaked
order: 0
---

<h1 class="home-logo"><img src="/cctweaked4tfgm/logo.png" alt="群峦格雷的 CC: Tweaked" /></h1>

**群峦格雷的 CC: Tweaked** 记录的是[群峦格雷现代版](https://github.com/TerraFirmaGreg-Team/Modpack-Modern)实际携带的计算机、海龟与外设。
模组本身是原样的 CC: Tweaked JAR；本站记录整合包在它周围改了什么，并提供与之匹配的 Lua 接口索引。

<VersionPill show-core />

它不是 CC: Tweaked 的分支：这里没有 Minecraft 代码、没有 mixin、也没有配方脚本。它与其它群峦格雷数据项目同属一族：

<table class="definition-list">
<tbody>
<tr><th><a href="https://github.com/TerraFirmaGreg-Team/QuestBook-Modern">QuestBook-Modern</a></th><td>FTB 任务章节 —— <em>整合包要我做什么？</em></td></tr>
<tr><th><a href="https://github.com/TerraFirmaGreg-Team/Field-Guide-Modern">Field-Guide-Modern</a></th><td>Patchouli 野外手册 —— <em>这个机制怎么运作？</em></td></tr>
<tr><th><a href="https://github.com/TerraFirmaGreg-Team/RecipeBook-Modern">RecipeBook-Modern</a></th><td>EMI 配方 bundle —— <em>这东西怎么合成？</em></td></tr>
<tr><th>cctweaked4tfgm</th><td>CC:T 全貌 + 群峦格雷改动 —— <em>计算机被改成了什么样？</em></td></tr>
</tbody>
</table>

## 本版本包含

<table class="definition-list">
<tbody>
<tr><th><a href="/zh_cn/recipes/">配方</a></th><td>删除 CC:T 的全部配方，改用格雷机器重写（MV → LuV）。全部 54 个配方布局都直接从同一发行版导出的 EMI bundle 渲染，不再跳到别的项目。</td></tr>
<tr><th><a href="/zh_cn/guide/turtle-upgrades">海龟升级</a></th><td>20 种格雷材料 × 5 种工具 = 73 个 <code>computercraft:tool</code> 升级，直接从实际注册的物品推导。</td></tr>
<tr><th><a href="/zh_cn/quests/">任务映射</a></th><td>55 个 ComputerCraft 任务及其依赖图与所需物品。</td></tr>
<tr><th><a href="/zh_cn/api/">Lua 接口</a></th><td>CC:T 1.121.0 的完整符号索引，锁定整合包内的版本，并链接到 tweaked.cc 对应页面。</td></tr>
<tr><th><a href="/zh_cn/guide/">指南</a></th><td>逐项列出群峦格雷的改动：配方、进度、语言、配置、高级外设与版本历史。</td></tr>
</tbody>
</table>

## 配方一览

<RecipeBrowser show-removals />

## 数据从哪来

本站没有一条数据是手抄的。`scripts/extract-tfgm.mjs` 把 Modpack-Modern 的 KubeJS 配方脚本放到一个会记录调用的配方 DSL mock 上执行，
再从同一发行版读取任务章节、配置和语言文件，写入 `docs/data/`。随后 `scripts/fetch-emi-bundle.mjs` 从已发布的群峦格雷配方书
bundle 中抽取对应的 EMI 布局与图标图集，所以这里的配方卡是游戏自己渲染的结果，而不是仿画。

完整流程与发布前的校验见[数据流水线](/zh_cn/guide/data-pipeline)。
