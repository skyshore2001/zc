import Vue from 'vue'
import router from './router'
import store from './store'

import NProgress from 'nprogress' // progress bar
import '@/components/NProgress/nprogress.less' // progress bar custom style
import notification from 'ant-design-vue/es/notification'
import { setDocumentTitle, domTitle } from '@/utils/domUtil'
import { ACCESS_TOKEN } from '@/store/mutation-types'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['login', 'register', 'registerResult'] // no redirect whitelist
const defaultRoutePath = '/dashboard/workplace'

router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  to.meta && (typeof to.meta.title !== 'undefined' && setDocumentTitle(`${to.meta.title} - ${domTitle}`))

  if (whiteList.includes(to.name) || g_data.userInfo) {
    // 在免登录白名单，直接进入
    next();
    return;
    // NProgress.done() // if current page is login will not trigger afterEach hook, so manually handle it
  }

  store.dispatch('GetInfo')
    .then(res => {
      const redirect = decodeURIComponent(from.query.redirect || to.path)
      if (to.path === redirect) {
        // 获取用户信息且处理权限后将动态添加路由，后应重刷页面
        // hack方法 确保addRoutes已完成 ,set the replace: true so the navigation will not leave a history record
        next({ ...to, replace: true })
      } else {
        // 跳转到目的路由
        next({ path: redirect })
      }
    })
    .catch(() => {
      next({ path: '/user/login', query: { redirect: to.fullPath } })
    })
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
