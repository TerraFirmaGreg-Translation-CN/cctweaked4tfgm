---
title: Configuration
order: 9
---

# Configuration

<VersionPill show-core />

The following values come from `defaultconfigs/computercraft-server.toml` and `config/computercraft-client.toml` in the release, diffed against CC:T 1.121.0's own defaults.

<ConfigTable />

## Reading the diff

TFGM overrides **nothing**. Every value equals upstream, which is worth stating explicitly because it is a decision, not an accident:

- **HTTP stays on** (`http.enabled = true`) with CC:T's default rules: `$private` denied, everything else allowed, 16 MiB download / 4 MiB upload per request, 32 MiB/s global bandwidth. The `$private` rule is what [GHSA-g5h5-fp5g-fmx4](https://github.com/cc-tweaked/CC-Tweaked/security/advisories/GHSA-g5h5-fp5g-fmx4) bypassed before 1.121.0 — so pinning 1.121.0 is the actual mitigation, not a config change.
- **Turtles need fuel** (`turtle.need_fuel = true`), 20 000 / 100 000 fuel units. No creative-flight turtles.
- **Terminal stays 51×19**, monitors max 8×6, `computer_threads = 1`.
- **`command_require_creative = true`** and `peripheral.command_block_enabled = false` — command computers and command block peripherals stay admin-only.

## Server tuning you may want

These are the levers TFGM left untouched that a server owner usually touches:

| Key | Default | Consider |
| --- | --- | --- |
| `execution.max_main_computer_time` | 5 ms | Raise on a busy server before blaming players' code |
| `execution.computer_threads` | 1 | >1 helps with many computers but breaks mods that assume main-thread execution |
| `http.bandwidth.global_download` | 32 MiB/s | Lower if players use computers as downloaders |
| `upload_max_size` | 512 KiB | Raise for large pasted programs |
| `peripheral.monitor_bandwidth` | 1 MB/tick | Raise if large monitor walls flicker |

## Where overrides would go

KubeJS cannot change CC:T config. A pack override would be a file in `defaultconfigs/` (server) or `config/` (client) shipped through `Modpack-Modern`'s `overrides` list — both are present in the pack, so an override is one TOML edit away.
