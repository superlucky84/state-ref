import { createApp } from 'vue';

// import App from './App.vue';
// createApp(App).mount('#app');

/**
 * 서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다(수동 테스트).
 */
/*
import Age from './Age.vue';
import Age1 from './Age1.vue';
import Age2 from './Age2.vue';
createApp(Age).mount('#app');
createApp(Age1).mount('#app1');
createApp(Age2).mount('#app2');
*/
import AgeWithAction from './AgeWithAction.vue';

createApp(AgeWithAction).mount('#app');
