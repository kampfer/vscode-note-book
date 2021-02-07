<template>
    <i :class="myClassName"></i>
</template>

<script>
export default {
    props: {
        iconName: {
            type: String,
            required: true,
        }
    },
    computed: {
        myClassName() {
            return `ms-Icon ms-Icon--${this.iconName}`;
        }
    }
}
</script>

<style scoped>
@import url(../assets/iconfont/css/icons.css);
</style>