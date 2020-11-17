import Vue from 'vue'
import { login, getInfo, logout } from '@/api/login'
import { ACCESS_TOKEN } from '@/store/mutation-types'
import { welcome } from '@/utils/util'
import router from '@/router'
import store from '@/store'

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

function handleLogin(data, commit)
{
  g_data.userInfo = data;
  const roles = applyPermission();
  store.dispatch('GenerateRoutes', { roles }).then(() => {
    // 根据roles权限生成可访问的路由表
    // 动态添加可访问路由表
    router.addRoutes(store.state.permission.addRouters)
  })
  commit('SET_ROLES', roles)
  commit('SET_INFO', data)

  commit('SET_NAME', { name: data.name, welcome: welcome() })
  // TODO
  commit('SET_AVATAR', data.avatar)
}

const user = {
  state: {
    token: '',
    name: '',
    welcome: '',
    avatar: '',
    roles: [],
    info: {}
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, { name, welcome }) => {
      state.name = name
      state.welcome = welcome
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_INFO: (state, info) => {
      state.info = info
    }
  },

  actions: {
    // 登录
    Login ({ commit }, userInfo) {
      return callSvr('login',userInfo, $.noop, null, {noex:1}).then(res => {
        handleLogin(res, commit);
//          Vue.ls.set(ACCESS_TOKEN, res._token, 7 * 24 * 60 * 60 * 1000)
//          commit('SET_TOKEN', 1);
      })
    },

    // 获取用户信息
    GetInfo ({ commit }) {
      return callSvr("Employee.get", $.noop, null, {noex:1}).then(result => {
          handleLogin(result, commit);
      })
    },

    // 登出
    Logout ({ commit, state }) {
      return WUI.logout(true);
          /*
          commit('SET_TOKEN', '')
          commit('SET_ROLES', [])
          Vue.ls.remove(ACCESS_TOKEN)
          */
    }
  }
}

export default user
