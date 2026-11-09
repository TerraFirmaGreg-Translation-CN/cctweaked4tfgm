---
title: 整合包联动
order: 13
---

# 整合包联动

<VersionPill show-core />

CC: Tweaked 真正的价值在于读取并驱动整合包里的其他模组。群峦格雷主要暴露三类接口：

| 接口 | 在 Lua 中的形态 | 入口 |
| --- | --- | --- |
| 格雷科技现代版 | 基于 capability 的通用外设，以及机器、能量存储、中央监控器、涡轮、覆盖板等专属方块 | [格雷科技联动](/zh_cn/tfgm/integrations-gregtech) |
| 机械动力 | 方块专属外设：速度计、显示链接器、辉光管、齿轮箱、列车、包裹、仓储发报机 | [机械动力联动](/zh_cn/tfgm/integrations-create) |
| 高级外设 | 专属方块：ME 网关、库存管理器、地质扫描仪、方块读取器、聊天框、NBT 存储、自动化核心 | [高级外设](/zh_cn/tfgm/advanced-peripherals) |

## 包装一个方块

所有联动都通过 [`peripheral`](/module/peripheral/) 进行：

```lua
local machine = peripheral.wrap("right")        -- 按朝向
local network = peripheral.wrap("wired_modem")  -- 按有线网络名
```

不知道朝向时，可以枚举计算机能看到的所有名字，再用 `pcall` 探测：

```lua
for _, name in ipairs(peripheral.getNames()) do
    local ok, peripheralObject = pcall(peripheral.wrap, name)
    if ok and peripheralObject then
        print(name, peripheral.getType(name))
    end
end
```

格雷的 capability 不会以 `peripheral.getType` 的名字出现，因此可靠的做法是 `peripheral.wrap` 之后用 `pcall` 调用具体方法。

## 读是安全的，写不是

大多数方块只提供 `get*` 方法，少数提供 `set*`。优先做只读仪表盘：只读的计算机不会卡死生产线。确实要调用 `setWorkingEnabled`、`setForcedRed` 之类的写方法时，包一层保护，避免某个方块没有该方法就中断整个程序：

```lua
local function try(object, method, ...)
    if type(object[method]) ~= "function" then return nil end
    local ok, result = pcall(object[method], ...)
    if not ok then print("call failed:", method, result) end
    return ok and result or nil
end
```

通用 capability 的方法见[通用外设](/generic_peripheral/inventory/)；整合包专属方法见两个联动页面。
