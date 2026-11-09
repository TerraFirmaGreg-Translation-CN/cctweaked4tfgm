---
title: 语言与文本
order: 6
---

# 语言与文本

<VersionPill show-core />

## UTF-8 支持

原版 ComputerCraft 终端是单字节的：每个字符是一个 `latin` 字节，`char` 事件携带 0–255 的数字。这让中文、俄文和带变音符号的拉丁文本在游戏内无法使用。

自群峦格雷 0.13.0 起，整合包加入了 **CC UTF-8 Compat**（`cc_utf8_compat`，作者 egr177），由 `config/cc_utf8_compat-common.toml` 开启：

```toml
#Enable UTF-8 compatibility patches for CC:Tweaked.
ccUtf8Compat = true
```

它修补的内容：

- 计算机终端与显示器上的 UTF-8 渲染
- UTF-8 键盘输入与剪贴板粘贴
- Unicode 计算机标签
- 客户端与服务端之间的终端同步
- 打印机 / 打印纸文本
- CraftOS 的 Lua 侧编码补丁

0.13.0 的更新日志明确说明了迁移：已有程序继续运行，合法的 UTF-8 正常显示，而**以乱码保存**的程序必须手工修正——重新打开再保存不会恢复原字符。

## 语言覆盖文件

群峦格雷为 18 个语种提供了 `kubejs/assets/computercraft/lang/*.json`。这些是 KubeJS 覆盖层，叠加在 CC:T 自己的 lang 文件之上；这里缺失的键会回退到 CC:T 对该语种的翻译（CC:T 也没有时回退英文）。

<LangCoverage />

## 这些数字的含义

`en_us` 是 CC:T 英文字符串的**快照副本**，不是重写：233 个键，与上游 1.121.0 零差异。它的作用只是让 KubeJS 能往同一命名空间里注入群峦格雷专用键。

CC:T 1.121.0 新增的两个键在所有语种的快照里都缺失：

| 键 | 游戏内影响 |
| --- | --- |
| `dataPack.turtle_storage.description` | 海龟存储数据包的描述——正常游玩几乎见不到 |
| `upgrade.computercraft.storage.adjective` | 存储升级海龟的“Storage”前缀 |

两者都回退英文。这是外观缺口，不是崩溃风险。

## 唯一一处真正的翻译改动

`zh_cn` 只改了一个值：

```diff
- "itemGroup.computercraft": "ComputerCraft",
+ "itemGroup.computercraft": "计算机工艺",
```

`zh_tw` 同理改为 `電腦工藝`。`zh_cn` 的其余全部内容都与 CC:T 自带的简体中文翻译一致，这也是任务文本与物品名能对上的原因。

键数极低的语种（`lt_lt` 只有 1 个键、`vi_vn` 41 个）看着吓人，但那是打包产物：它们只保存了有人贡献的那几条字符串，其余由 CC:T 自带翻译补齐。
