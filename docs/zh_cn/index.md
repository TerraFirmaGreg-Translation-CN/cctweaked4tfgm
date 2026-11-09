---
layout: home
hero:
  name: 'TerraFirmaGreg 的 CC: Tweaked'
  text: '格雷科技整合包里的可编程计算机'
  tagline: '群峦格雷现代版随身携带的 CC: Tweaked —— 版本锁定的配方、海龟升级、任务映射与 Lua 接口索引。'
  actions:
    - theme: brand
      text: 阅读指南
      link: /zh_cn/guide/
    - theme: alt
      text: 配方表
      link: /zh_cn/recipes/
    - theme: alt
      text: 上游文档
      link: https://tweaked.cc/
features:
  - title: 群峦格雷改了什么
    details: 删除 CC:T 的全部配方，改用格雷机器重写，门槛从 MV 一直到 LuV。海龟仍可合成，但从创造模式物品栏中隐藏。
    link: /zh_cn/guide/differences
    linkText: 与上游对比
  - title: 配方参考
    details: 本版本全部 54 个 CC / AP 食谱，可搜索；每行都链接到导出的 EMI bundle 查看渲染图。
    link: /zh_cn/recipes/
    linkText: 浏览配方
  - title: 海龟升级
    details: 20 种格雷材料 × 5 种工具 = 73 个工具升级，直接从实际注册的物品推导。
    link: /zh_cn/guide/turtle-upgrades
    linkText: 查看矩阵
  - title: Lua 接口索引
    details: CC:T 1.121.0 的全局函数、API、外设与事件，全部指向 tweaked.cc 对应版本的页面。
    link: /zh_cn/api/
    linkText: 打开索引
---

<VersionPill show-core />

## 这是什么仓库

`cctweaked4tfgm` 记录的是**群峦格雷现代版实际使用的 CC: Tweaked**。它不是 CC:T 的分支，也不包含任何 Minecraft 代码，而是一个与
[QuestBook-Modern](https://github.com/TerraFirmaGreg-Team/QuestBook-Modern)、
[Field-Guide-Modern](https://github.com/TerraFirmaGreg-Team/Field-Guide-Modern)、
[RecipeBook-Modern](https://github.com/TerraFirmaGreg-Team/RecipeBook-Modern) 同族的文档与数据站点：

| 仓库 | 导出内容 | 回答的问题 |
| --- | --- | --- |
| QuestBook-Modern | FTB 任务章节 | *整合包要我做什么？* |
| Field-Guide-Modern | Patchouli 野外手册 | *这个机制怎么运作？* |
| RecipeBook-Modern | EMI 配方 bundle | *这东西怎么合成？* |
| **cctweaked4tfgm** | CC:T 全貌 + 群峦格雷改动 | *计算机被改成了什么样？* |

数据层由发行版本身生成（见[数据流水线](/zh_cn/guide/data-pipeline)），所以群峦格雷升级 CC:T 时，这里的表格会自动跟着变。

## 本版本的全部配方

<RecipeBrowser :show-removals="true" />
