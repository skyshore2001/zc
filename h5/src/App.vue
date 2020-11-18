<template>
  <a-locale-provider :locale="locale">
    <div id="app">
      <router-view/>
    </div>
  </a-locale-provider>
</template>

<script>
import bootstrap from './core/bootstrap'
import store from './store/'
import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN'

import { AppDeviceEnquire } from '@/utils/mixin'

import Vue from 'vue'
import router from './router'

import NProgress from 'nprogress' // progress bar
import '@/components/NProgress/nprogress.less' // progress bar custom style
import notification from 'ant-design-vue/es/notification'
import { setDocumentTitle, domTitle } from '@/utils/domUtil'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  to.meta && (typeof to.meta.title !== 'undefined' && setDocumentTitle(`${to.meta.title} - ${domTitle}`))

  if (WUI.options.whiteList.includes(to.name) || g_data.userInfo) {
    // 在免登录白名单，直接进入
    next();
    return;
    // NProgress.done() // if current page is login will not trigger afterEach hook, so manually handle it
  }

  WUI.tryAutoLoginAsync(handleLogin, "Employee.get")
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

// {perms, rolePerms} => retRole={permissions, permissionList}
// rolePerms格式为 "dashboard table.query table.set" => permissionList=["dashboard", "table"]
//  permissions=[{permissionId: "dashboard", actionList: ["all"]}, {permissionId: "table", actionList: ["query", "set"] } ]
// perms格式为 "mgr" => name="最高管理员", "emp" => name="管理员", "item" => name="item"
function applyPermission()
{
  var perms = g_data.userInfo.perms;
  var rolePerms = g_data.userInfo.rolePerms;
  var retRole = {
    id: perms,
    name: null,
    permissions: [],
    permissionList: []
  }

  if (!perms)
    return retRole;

  var arr = perms.split(/,/);
  g_data.hasRole = g_data.hasPerm = function (perm) {
    return arr.indexOf(perm) >= 0;
  }

  if (g_data.hasRole("mgr")) {
    retRole.name = "最高管理员";
  }
  else if (g_data.hasRole("emp")) {
    retRole.name = "管理员";
  }
  else {
    retRole.name = perms;
  }

  if (rolePerms) {
    var permArr = rolePerms.split(/\s+/);
    permArr.forEach(e => {
      var a = e.split('.');
      var permId = a[0];
      if (a.length == 1) {
        if (retRole.permissionList.indexOf(permId) < 0) {
          retRole.permissions.push({permissionId: permId, actionList: ["all"]});
          retRole.permissionList.push(permId);
        }
      }
      else if (a.length == 2) {
        var idx = retRole.permissionList.indexOf(permId);
        if (idx < 0) {
          retRole.permissions.push({permissionId: permId, actionList: [a[1]]});
          retRole.permissionList.push(permId);
        }
        else {
          retRole.permissions[idx].actionList.push(a[1]);
        }
      }
    });
  }
  return retRole;
}

/**
过滤账户是否拥有某一个权限，并将菜单从加载列表移除

- mgr: 有所有权限
- emp: 除admin外所有权限
- 其它：根据permissionList来确定。
 */
function hasPermission (role, route) {
  if (role.id == "mgr")
    return true;

  let list = role.permissionList;
  if (route.meta && route.meta.permission) {
    if (role.id == "emp" && !route.meta.permission.includes("admin"))
      return true

    let flag = false
    for (let i = 0, len = list.length; i < len; i++) {
      flag = route.meta.permission.includes(list[i])
      if (flag) {
        return true
      }
    }
    return false
  }
  return true
}

import { asyncRouterMap, constantRouterMap } from '@/config/router.config'

function filterAsyncRouter (routerMap, roles) {
  const accessedRouters = routerMap.filter(route => {
    if (hasPermission(roles, route)) {
      if (route.children && route.children.length) {
        route.children = filterAsyncRouter(route.children, roles)
      }
      return true
    }
    return false
  })
  return accessedRouters
}

function handleLogin(data)
{
  WUI.handleLogin(data);

  // 根据roles权限生成可访问的路由表
  // 动态添加可访问路由表
  const roles = applyPermission();
  const accessedRouters = filterAsyncRouter(asyncRouterMap, roles)
  router.addRoutes(accessedRouters)
  g_data.pages = accessedRouters;
  /*
  commit('SET_ROLES', roles)
  commit('SET_INFO', data)

  commit('SET_NAME', { name: data.name, welcome: welcome() })
  // TODO
  commit('SET_AVATAR', data.avatar)
  */
}

export default {
  router,
  store,
//  mixins: [AppDeviceEnquire],
  created: bootstrap,
  data () {
    return {
      locale: zhCN
    }
  },
  mounted () {
    this.$store.commit('TOGGLE_DEVICE', 'desktop')
    this.$store.dispatch('setSidebar', true)

  },
  methods: {
    login(param) {
      return callSvr('login', param).then(handleLogin);
    },
    logout() {
      return WUI.logout();
    }
  }
}
</script>
<style>
  #app {
    height: 100%;
  }
</style>
