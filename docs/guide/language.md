---
title: Language and text
order: 6
---

# Language and text

<VersionPill show-core />

## UTF-8 support

Vanilla ComputerCraft terminals are single-byte: every character is one `latin` byte and a `char` event carries a number 0–255. That makes Chinese, Russian and accented Latin text unusable in-game.

Since TFGM 0.13.0 the pack adds **CC UTF-8 Compat** (`cc_utf8_compat`, author egr177), enabled by `config/cc_utf8_compat-common.toml`:

```toml
#Enable UTF-8 compatibility patches for CC:Tweaked.
ccUtf8Compat = true
```

What it patches:

- UTF-8 rendering in computer terminals and on monitors
- UTF-8 keyboard input and clipboard paste
- Unicode computer labels
- terminal synchronisation between client and server
- printer / printed-page text
- CraftOS Lua-side encoding patches

The 0.13.0 changelog is explicit about migration: existing programs keep running, valid UTF-8 displays correctly, and programs saved with mojibake **must be corrected by hand** — re-opening and saving does not recover the original characters.

## Locale overrides

TFGM ships `kubejs/assets/computercraft/lang/*.json` for 18 locales. These files are KubeJS overrides layered on top of CC:T's own lang files, so a key missing here falls back to CC:T's bundled translation for that locale (and to English if CC:T has none).

<LangCoverage />

## What the numbers mean

`en_us` is a **snapshot copy** of CC:T's English strings, not a rewrite: 233 keys, zero value differences against upstream 1.121.0. It exists so KubeJS can inject TFGM-specific keys into the same namespace.

Two keys introduced by CC:T 1.121.0 are missing from the snapshot in every locale:

| Key | Effect in game |
| --- | --- |
| `dataPack.turtle_storage.description` | Turtle storage datapack description — rarely seen in normal play |
| `upgrade.computercraft.storage.adjective` | "Storage" prefix for storage-upgraded turtles |

Both fall back to English. This is a cosmetic gap, not a crash risk.

## The one real translation change

`zh_cn` changes a single value:

```diff
- "itemGroup.computercraft": "ComputerCraft",
+ "itemGroup.computercraft": "计算机工艺",
```

`zh_tw` does the same with `電腦工藝`. Everything else in `zh_cn` matches CC:T's own Simplified Chinese translation, which is why the quest text and the item names agree.

Locales with very low key counts (`lt_lt` at 1 key, `vi_vn` at 41) look alarming but are packing artifacts: they hold only the handful of strings someone contributed, and CC:T's own translations fill the rest.
