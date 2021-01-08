<template>
    <page class="channel-search-page">
        <basic-action-bar :windowTitle="$t('search_channel')" />
        <channel-list :network="network" :search="search" />
    </page>
</template>

<script>
'kiwi public';

import ChannelList from './ChannelList';

export default {
    components: { ChannelList },
    props: ['network', 'search'],
};

</script>
