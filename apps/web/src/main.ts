import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import i18nPlugin from './i18n';

const app = createApp(App);
app.use(i18nPlugin);
app.mount('#app');

