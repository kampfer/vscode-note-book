// document.body.innerHTML = (new Date()).toString();

import * as Vue from 'vue';
import notebook from './notebook.vue';

import './notebook.css';

const appWrapper = document.createElement('div');
appWrapper.id = 'app';
document.body.appendChild(appWrapper);

const app = Vue.createApp({
    template: '<notebook></notebook>',
    components: { notebook }
});
app.mount('#app');
