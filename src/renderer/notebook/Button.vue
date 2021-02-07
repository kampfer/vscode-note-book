<template>
    <button class="component-Button"><font-icon class="component-Button-icon" v-bind="iconProps"></font-icon></button>
</template>

<script>
import FontIcon from './FontIcon.vue';

export default {
    components: {
        FontIcon
    },
    props: {
        iconProps: {
            type: Object
        }
    }   
}
</script>

<style scoped>
.component-Button {
    outline: transparent;
    border: none;
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    padding: 0px 4px;
    width: 32px;
    height: auto;
    background-color: transparent;
    color: rgb(96, 94, 92);
    user-select: none;
    display: inline-block;
}

.component-Button:hover {
    color: rgb(16, 110, 190);
    background-color: rgb(243, 242, 241);
}
</style>