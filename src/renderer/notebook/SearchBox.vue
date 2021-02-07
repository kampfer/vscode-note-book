<template>
    <div class="component-SearchBox">
        <div class="component-SearchBox-iconContainer">
            <FontIcon iconName="Search"></FontIcon>
        </div>
        <input class="component-SearchBox-field"/>
        <div class="component-SearchBox-clearButton">
            <Button :iconProps="cancelIconProps"></Button>
        </div>
    </div>
</template>

<script>
import Button from './Button.vue';
import FontIcon from './FontIcon.vue';

export default {
    components: {
        Button,
        FontIcon,
    },
    data() {
        return {
            cancelIconProps: {
                iconName: 'Cancel'
            }
        };
    }
}
</script>

<style scoped>
.component-SearchBox {
    padding: 1px 0px 1px 4px;
    box-sizing: border-box;
    border-radius: 2px;
    border: 1px solid rgb(96, 94, 92);
    color: rgb(50, 49, 48);
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
    font-size: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-shrink: 0;
}

.component-SearchBox .component-SearchBox-field {
    border: none;
    outline: none;
    flex: 1 1 0px;
    font-size: inherit;
    color: rgb(50, 49, 48);
    min-width: 0px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.component-SearchBox .component-SearchBox-clearButton {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex-basis: 32px;
    flex-shrink: 0;
    padding: 0px;
    margin: -1px 0px;
}
</style>