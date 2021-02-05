<template>
    <div class="component-SearchBox">
        <div class="component-SearchBox-iconContainer">
            <i class="component-SearchBox-icon"></i>
        </div>
        <input class="component-SearchBox-field"/>
    </div>
</template>

<script>
export default {
    
}
</script>

<style scoped>
.component-SearchBox {
    padding: 1px 0px 1px 4px;
    box-sizing: border-box;
    border-radius: 2px;
    border: 1px solid rgb(96, 94, 92);
    height: 32px;
    display: flex;
    flex-flow: row nowrap;
    align-items: stretch;
    font-size: 14px;
    font-weight: 400;
}

.component-SearchBox .component-SearchBox-iconContainer {
    width: 32px;
    color: rgb(0, 120, 212);
    text-align: center;
    transition: width 0.167s ease 0s;
    flex-shrink: 0;
    font-size: 16px;
}

.component-SearchBox .component-SearchBox-field {
    border: none;
    outline: none;
    flex: 1 1 0px;
}
</style>