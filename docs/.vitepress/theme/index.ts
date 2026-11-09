// Theme entry: extends the VitePress default theme with the TerraFirmaGreg
// palette (shared with wiki.terrafirmagreg.team viewers) and registers the
// data-driven components used by the CC pages.

import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';

import './tfgm.css';

import TierBadge from './components/TierBadge.vue';
import VersionPill from './components/VersionPill.vue';
import ModPins from './components/ModPins.vue';
import RecipeBrowser from './components/RecipeBrowser.vue';
import TurtleMatrix from './components/TurtleMatrix.vue';
import ConfigTable from './components/ConfigTable.vue';
import LangCoverage from './components/LangCoverage.vue';
import QuestList from './components/QuestList.vue';
import UpgradeDataFile from './components/UpgradeDataFile.vue';
import TierLegend from './components/TierLegend.vue';
import QuestBookLink from './components/QuestBookLink.vue';
import ApiIndex from './components/ApiIndex.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TierBadge', TierBadge);
    app.component('VersionPill', VersionPill);
    app.component('ModPins', ModPins);
    app.component('RecipeBrowser', RecipeBrowser);
    app.component('TurtleMatrix', TurtleMatrix);
    app.component('ConfigTable', ConfigTable);
    app.component('LangCoverage', LangCoverage);
    app.component('QuestList', QuestList);
    app.component('UpgradeDataFile', UpgradeDataFile);
    app.component('TierLegend', TierLegend);
    app.component('QuestBookLink', QuestBookLink);
    app.component('ApiIndex', ApiIndex);
  },
} satisfies Theme;
