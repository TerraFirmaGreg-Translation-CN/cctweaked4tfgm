---
title: Recipe index
order: 10
---

# Recipes

<VersionPill show-core />

Searchable index of every CC/AP recipe the release defines. Click a row for raw ingredient ids, then follow the link into the recipe book for the rendered EMI card.

<RecipeBrowser :show-removals="true" />

## By machine

<RecipeBrowser :machines="['assembler']" />

## Disks

<RecipeBrowser :machines="['chemical_bath']" />

## GT shaped and shapeless

<RecipeBrowser :machines="['crafting', 'shapeless']" />
