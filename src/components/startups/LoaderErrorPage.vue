<template>
    <page class="test">
        <stack-layout verticalAlignment="center">
            <label
                class="text-danger fas text-center m-b-20 test"
                fontSize="200"
                text=""
            />
            <label
                class="text-danger body text-center p-x-20"
                textWrap="true"
                :text="error"
            />
        </stack-layout>
    </page>
</template>

<script>
'kiwi public';

export default {
    props: ['error'],
};
</script>

<style></style>
