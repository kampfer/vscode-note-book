<template>
    <div class="component-SearchBox">
        <div class="component-SearchBox-iconContainer">
            <FontIcon iconName="Search" @click="focus"></FontIcon>
        </div>
        <input
            ref="input"
            class="component-SearchBox-field"
            type="text"
            v-model="keyword"
            :placeholder="placeholder"
            @focus="handleFocusAtInput"
            @blur="handleBlurAtInput"
        />
        <div class="component-SearchBox-clearButton" v-if="displayClearButton">
            <Button :iconProps="cancelIconProps" class="clear-btn" @mousedown="handleMousedownAtBtn"></Button>
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
    props: {
        placeholder: String,
    },
    data() {
        return {
            keyword: '',
            focused: false,
            cancelIconProps: {
                iconName: 'Cancel'
            }
        };
    },
    computed: {
        displayClearButton() {
            return this.keyword.length > 0;
        }
    },
    watch: {
        focused(v) {
            if (v) {
                this.$el.classList.add('is-active');
                this.$refs.input.focus();
            } else {
                this.$el.classList.remove('is-active');
                this.$refs.input.blur();
            }
        }
    },
    methods: {
        handleFocusAtInput(e) {
            this.focus();
        },
        handleBlurAtInput(e) {
            this.blur();
        },
        handleMousedownAtBtn(e) {
            e.preventDefault();
            this.clear();
        },
        clear() {
            this.keyword = '';
        },
        focus() {
            this.focused = true;
        },
        blur() {
            this.focused = false;
        },
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
    border-radius: 2px;
}

.component-SearchBox.is-active {
    border: 1px solid rgb(0, 120, 211);
}

.component-SearchBox.is-active .component-SearchBox-iconContainer {
    width: 0;
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