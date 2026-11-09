---
title: What TFGM changes
order: 2
---

# What TFGM changes

<VersionPill show-core />

TFGM's modifications live in four places. Nothing in this list patches CC:T bytecode except the creative-tab mixin.

| Layer | File | What it does |
| --- | --- | --- |
| Recipes | `kubejs/server_scripts/computer_craft/recipes.js` | Deletes every CC:T recipe except printed pages/books, rebuilds the rest on GregTech machines |
| Data | `kubejs/server_scripts/computer_craft/data.js` | Generates one `computercraft:tool` upgrade per GT material × tool type |
| Tags | `kubejs/server_scripts/computer_craft/tags.js` | Piglin tags, TFC hoe-harvestable tag |
| Client | Core-Modern `ModRegistryMixin` | Cancels `ModRegistry.addTurtle` so turtles never reach the creative tab |

## Recipe deletion

The first statement is a wholesale removal:

```js
event.remove({
	not: [
		{ id: 'computercraft:printed_pages' },
		{ id: 'computercraft:printed_book' },
	], mod: 'computercraft'
});
```

Only the printed-book chain survives with its vanilla recipe. Everything else — computers, turtles, monitors, drives, modems, printers, speakers, relaying — is re-added below.

## The recipe set

<RecipeBrowser />

## What is *not* changed

- **Server config.** `defaultconfigs/computercraft-server.toml` matches CC:T defaults key for key. No performance tuning, no HTTP lock-down beyond what CC:T already does. See [configuration](/tfgm/configuration).
- **Java code.** The JAR is stock. The only hook is the creative-tab mixin.
- **Lua APIs.** Every `turtle`, `peripheral`, `rednet`, `fs` function behaves exactly as upstream documents it.

## Creative tab

TFGM does not ship turtle models — the `ComputerCraft Greg Refreshed` resource pack (CLIENT side, 117 CC texture/model files) has no turtle block models. To avoid untextured entries, Core-Modern mixes into `dan200.computercraft.shared.ModRegistry`:

```java
@Inject(method = "addTurtle", at = @At("HEAD"), cancellable = true)
private static void tfg$removeTurtleStream(CreativeModeTab.Output out, TurtleItem turtle, CallbackInfo ci) {
    ci.cancel();
}
```

The same commit pairs it with `APCreativeTabMixin`, which redirects `CreativeModeTab.Output.acceptAll(Collection)` to drop Advanced Peripherals' turtle/pocket variants from the AP tab.

**Turtles are still craftable.** They just do not appear in the creative menu, and they render with CC:T's own textures in world.

::: warning Registering the mixin
The mixin must be listed in `tfg.mixins.json` (`common.cc_tweaked.ModRegistryMixin`). If a future CC:T release renames `addTurtle`, the injector fails at load and Core-Modern refuses to start — that is deliberate, a silent no-op would put untextured turtles back in the tab.
:::
