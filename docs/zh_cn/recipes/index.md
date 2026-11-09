---
title: 配方索引
order: 10
---

# 配方

<VersionPill show-core />

本版本定义的全部 CC / AP 配方索引。点击行查看原始原料 id，再点进配方书查看渲染后的 EMI 卡片。

<RecipeBrowser :show-removals="true" />

## 按机器

<RecipeBrowser :machines="['assembler']" />

## 软盘

<RecipeBrowser :machines="['chemical_bath']" />

## 格雷工作台合成

<RecipeBrowser :machines="['crafting', 'shapeless']" />
