---
title: 配置
order: 9
---

# 配置

<VersionPill show-core />

下面的值来自发行版里的 `defaultconfigs/computercraft-server.toml` 与 `config/computercraft-client.toml`，并与 CC:T 1.121.0 自身的默认值做了对比。

<ConfigTable />

## 如何理解这份差异

群峦格雷**没有覆盖任何一项**。每个值都等于上游，这一点值得明说，因为它是决定而不是巧合：

- **HTTP 保持开启**（`http.enabled = true`），沿用 CC:T 默认规则：拒绝 `$private`、允许其余主机、每请求 16 MiB 下载 / 4 MiB 上传、全局带宽 32 MiB/s。`$private` 规则正是 [GHSA-g5h5-fp5g-fmx4](https://github.com/cc-tweaked/CC-Tweaked/security/advisories/GHSA-g5h5-fp5g-fmx4) 在 1.121.0 之前被绕过的地方——所以真正的缓解手段是锁定 1.121.0，而不是改配置。
- **海龟需要燃料**（`turtle.need_fuel = true`），上限 20 000 / 100 000。没有创造飞行的海龟。
- **终端保持 51×19**，显示器最大 8×6，`computer_threads = 1`。
- **`command_require_creative = true`** 且 `peripheral.command_block_enabled = false`——命令计算机和命令方块外设仍然仅限管理员。

## 服主常用的调节项

以下是群峦格雷没有动、但服务器基本都会调的杠杆：

| 键 | 默认 | 建议 |
| --- | --- | --- |
| `execution.max_main_computer_time` | 5 ms | 在繁忙服务器上先调高这一项，再怀疑玩家代码 |
| `execution.computer_threads` | 1 | >1 对大量计算机有帮助，但会破坏假定主线程执行的模组 |
| `http.bandwidth.global_download` | 32 MiB/s | 玩家拿计算机当下载器时调低 |
| `upload_max_size` | 512 KiB | 需要粘贴大程序时调高 |
| `peripheral.monitor_bandwidth` | 1 MB/tick | 大显示器墙闪烁时调高 |

## 覆盖文件该放哪

KubeJS 无法修改 CC:T 配置。整合包的覆盖方式是放在 `defaultconfigs/`（服务端）或 `config/`（客户端）的文件，通过 `Modpack-Modern` 的 `overrides` 列表打包——两者在包里都已存在，所以一次 TOML 编辑就能生效。
