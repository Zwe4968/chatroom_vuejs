import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/global.css';
import { restoreSession } from './composable/Getuser';

restoreSession().finally(()=>{
    createApp(App).use(router).mount('#app')
});



