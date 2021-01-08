<template>
    <page id="app-settings" class="appsettings-page">
        <basic-action-bar :windowTitle="$t('kiwi_settings')" />

        <tabs>
            <tab-strip>
                <tab-strip-item :title="$t('settings_general')" />
                <tab-strip-item :title="$t('settings_aliases')" />
            </tab-strip>

            <tab-content-item>
                <settings-general />
            </tab-content-item>
            <tab-content-item>
                <settings-aliases />
            </tab-content-item>
        </tabs>
    </page>
</template>

<script>
'kiwi public';

import SettingsGeneral from './SettingsGeneral';
import SettingsAliases from './SettingsAliases';

export default {
    components: { SettingsGeneral, SettingsAliases },
};
</script>

<style scoped>
tab-strip {
    highlight-color: var(--accent3);
    font-weight: bold;
    color: var(--default-fg);
    background-color: var(--form-bg);
}
</style>
