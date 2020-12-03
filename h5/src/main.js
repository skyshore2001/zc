// with polyfills
import 'core-js/stable'
import 'regenerator-runtime/runtime'

import Vue from 'vue'
import router from './router'
import { VueAxios } from './utils/request'
// import echarts from 'echarts';
import App from './App.vue'


// mock
// WARNING: `mockjs` NOT SUPPORT `IE` PLEASE DO NOT USE IN `production` ENV.
import './mock'

import './core/lazy_use'
import './utils/filter' // global filter
import './components/global.less'

let serverUrl = "api/";
/* 由于chrome80后禁止跨域调用(same-origin问题)，调试时使用vue.config.js中的代理 */
$.extend(WUI.options, {
  serverUrl: serverUrl,
//  serverUrl: "http://localhost:8080/qiche/api/",
	appName: "emp-adm",
	fuzzyMatch: true,
//	title: APP_TITLE,
	onShowLogin: function () {
		router.push({
			path:'/user/login'
		})
	},
	// 免登录页面
	whiteList: ['login']
});

Vue.config.productionTip = false

// mount axios Vue.$http and this.$http
Vue.use(VueAxios)

window.app = new Vue(App).$mount('#app')
