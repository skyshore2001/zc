# antdpro-vue分析

入口和一些配置：
src\main.js

主菜单/全局路由配置：
src\config\router.config.js

组件全局引入：
src\core\lazy_lib\components_use.js

## 页面共用

@key jdCreate jdCreate是定义在'@/utils/util'中的工具，用于创建高阶组件。

示例：故障预警、故障预测和运维决策共用一个页面组件。页面上有一些细小差异，根据type不同来区分
anaResult.vue

        <a-col v-if="type=='决策'" :md="6" :sm="24">
            <a-form-item label="问题描述">
                <a-input v-model="queryParam.dscr" placeholder="" />
            </a-form-item>
        </a-col>

	export default{
		props: {
			type: {
				type: String,
				default: '预警'
			}
		},
		data(){
			const nameStr = this.type=='预测'? '预测故障': this.type=='预警'? '预警故障': '决策建议'
			return {
				url: WUI.makeUrl("AnaResult.query", {cond: `type='${this.type}'`}),
				nameStr,
				columns:[
					{ title: '时间', dataIndex: 'tm', sorter: true, },
					{ title: '车辆编码', dataIndex: 'veCode', sorter: true, },
					{ title: '列车编码', dataIndex: 'hubCode', sorter: false, },
					this.type == '决策' && { title: '问题描述', dataIndex: 'dscr', sorter: false, },
					{ title: nameStr, dataIndex: 'name', sorter: false, },
					{ title: '车辆状态', dataIndex: 'runFlag', sorter: false, jdEnumMap: RunFlagMap, jdEnumStyler: RunFlagStyler},
					{ title: '异常次数', dataIndex: 'exCnt', sorter: false, },
					{ title: '维修次数', dataIndex: 'repairCnt', sorter: false, },
					this.type != '决策' && { title: '预警等级', dataIndex: 'level', sorter: false, },
					{ title: '操作', dataIndex: '', sorter: false, align:'center', scopedSlots:{customRender:'details'} },
				]
			}
		},
    }

在路由定义中要注意，如果用相同的组件，通过props设置来区分这三个菜单项的话，它们是会共用一个页面的，如下所示：

    // 这样定义有问题，组件相同会导致页面共用
    const routerMap = [
        {
            path: '/health/faultWarning',
            name: 'FaultWarning',
            component: () => import('@/views/health/anaResult'),
            props: {type:"预警"},
            meta: { title: '故障预警' }
        },
        {
            path: '/health/faultPredict',
            name: 'FaultPredict',
            component: () => import('@/views/health/anaResult'),
            props: {type:"预测"},
            meta: { title: '故障预测' }
        }
    ...
    ]

这样的定义将导致三个页面完全相同，因为组件中没有对type属性的变动进行处理。一般像这种类型不同的页面，不希望它是共用的，所以我们通过jdCreate定义不同的三个组件来解决：

    const routerMap = [
        {
            path: '/health/faultWarning',
            name: 'FaultWarning',
            component: jdCreate(() => import('@/views/health/anaResult'), {type:"预警"}),
            meta: { title: '故障预警' }
        },
        {
            path: '/health/faultPredict',
            name: 'FaultPredict',
            component: jdCreate(() => import('@/views/health/anaResult'), {type:"预测"}),
            meta: { title: '故障预测' }
        },
        ...
    ]

## 列表页和详情页

按Restful风格的惯例，以车辆列表和详情为例，列表页URL用'/vehicle'，详情页用'/vehicle/:id' 其中':id'是编号参数。
路由设置：

          {
            path: '/ve/vehicle',
            name: 'VehicleList',
            component: () => import('@/views/ve/VehicleList'),
            meta: { title: '车辆列表', keepAlive: true }
          },
          {
            path: '/ve/vehicle/:id',
            name: 'VehicleDetail',
            hidden:true,
            props: true, // params自动转props
            component: () => import('@/views/ve/VehicleDetail'),
            meta: { title: '车辆详情' }
          }

注意：设置路由的props=true可以将params(即path中的参数)自动转成props.

在列表页中，跳转到详情页：

    this.$router.push({
        path:'/ve/vehicle/' + item.id
    })

这里也可以用相对路径如`'vehicle/' + item.id`
也可以用名称，如：

    this.$router.push({
        name: 'VehicleDetail',
        params: {id: item.id}
    })

在详情页，支持处理id:

		props: ["id"],
		watch: {
            // 最好有这个设置，便于url参数变化后能自动更新。如果页面在keep-alive中，则不能每次进入行执行created，这时必须用此处才能更新
			id() {
				this.loadPage()
			}
		},
		created(){
			this.loadPage()
		},
        methods: {
            loadPage() {
                var rv = async callSvr("Vehicle.get", {id: this.id});
            }
        }

## 程序入口分析

main.js是主入口，其中创建根实例（注册全局变量app）并加载App.vue。

	window.app = new Vue(App).$mount('#app')

在App.vue中含有`router-view`组件，通过指定router属性 (router/index.js，其中引入的router.config.js中定义的路由表），使得App的router-view使用的根视图如下：

  {
    path: '/',
    name: 'index',
    component: BasicLayout,
    meta: { title: '首页' },
    redirect: '/dashboard/workplace',
    children: ...
  }

其中component中指定的是BasicLayout（包含左侧菜单和右侧router-view），其children数组对应这个layout又包含一层的router-view，在children数组的各项指定的component中，有的是用的RouteView, 有的是PageView, 有的则直接是新开发的页面vue.
RouteView 比较简单，是antd-pro对系统router-view的简单封装，支持指定keep-alive（如果用了MultiTab，或指定keepAlive属性，或菜单项的meta中指定keepAlive; TODO: 删除？）；
PageView 是带有头部导航的页面框架，其中又包含个router-view，便于放下级页面，这样子项就有统一的头（当然也可以用 RouteView，然后在子项中以`<page-view>`做为顶层元素也可以）。

App.vue中做初始登录和路由管理。

	router.beforeEach((to, from, next) => {
	  如果是白名单页面(如login/reg等)，或已登录过（有g_data.userInfo信息），则直接进入指定页面，并设置docTitle;
	  否则先调用Employee.get取信息到g_data.userInfo，然后跳到目的页面。

由于dispatch/commit等机制烦琐，本项目中不使用vuex(store)。

全局变量：

- app { $router, $store, login(param), logout() }
- g_data.pages

## 登录与权限体系适配

它假定后端接口：（具体数据参考mock/services/user.js , const roleObj=...)

  user/info -> {@permissions, @permissionList, ...}

  - permissions: elem={roleId, permissionId, permissionName, @actions/细到CRUD等操作, @actionList}
  - actionList: ["add","set","del",...]
  - permissionList: ["dashboard", "table", ...] 后面根据该字段生成菜单项

其中permissionList用于处理路由项， 调用GenerateRoutes(roles)函数中生成路由项数组。
roles.permissionList数组是每个权限项代码，如["table","dashboard"]

在src/permission中处理登录。其逻辑是：

如果本地存储中有ACCESS_TOKEN, 则用它获取用户信息，否则跳转登录页。

由于筋斗云后端未使用ACCESS_TOKEN，而是用的cookie，其机制应改为：
先取用户信息（若有cookie则自动使用），如果失败则跳转登录页。

获取用户信息后根据权限生成路由（即菜单项），须在store.getters.addRouters数组中包含可用的路由项列表。
路由项在src/config/router.config.js中定义。注意其中有个constantRouterMap表示基础路由，无论权限如何都会显示。

在路由项中用meta.permission定义菜单需要的权限：

            meta: { title: '测试功能', keepAlive: true, permission: [ 'dashboard' ] }

结合筋斗云权限体系，User.get返回User.perms包含用户的角色：

- 如果角色有mgr则可访问所有，
- 如果角色有emp可访问除用户管理(可定义为"admin"权限)外的所有权限
- 其它角色可访问的内容由User.rolePerms定义。

permission中的permissionId和actions用于在显示页面时检查操作是否允许，由
actionList用来显示按钮。用法见 core/directives/action.js，自定义v-action指令：

    <i-button v-action:add >添加用户</a-button>
    <a-button v-action:delete>删除用户</a-button>
    <a v-action:edit @click="edit(record)">修改</a>


!!! 应根据后端返回用户信息的perms, rolePerms字段生成roles.permissionList。

## 关于vuex

取一个状态中的变量，使用getters.xxx:

  import store from './store'
    ...
  if (store.getters.roles.length === 0)
    ...

调用一个状态方法，要使用dispatch('xxx', param):

  store.dispatch('GenerateRoutes', { roles }).then(() => {
    router.addRoutes(store.getters.addRouters)
  }

它调用到 store/modules/permission.js: data是传过来的参数

  const permission = {
    state: {
      routers: constantRouterMap,
      addRouters: []
    },
    mutations: {
      SET_ROUTERS: (state, routers) => {
        state.addRouters = routers
        state.routers = constantRouterMap.concat(routers)
      }
    },
    actions: {
      GenerateRoutes ({ commit }, data) {
        return new Promise(resolve => {
          const { roles } = data
          const accessedRouters = filterAsyncRouter(asyncRouterMap, roles)
          commit('SET_ROUTERS', accessedRouters)
          resolve()
        })
      }
    }
  }

  export default permission

除了直接store.dispatch, 在vue页面中还有一种调用方式，即mapActions: views/user/Login.vue

  import { mapActions } from 'vuex'
  export default
    methods: {
      ...mapActions(['Login', 'Logout']),

      handleSubmit () {
        const loginParams = { ...values };
        this.Login(loginParams)
          .then((res) => this.loginSuccess(res))
          .catch(err => this.requestFailed(err))
          .finally(() => {
            state.loginBtn = false
          })
     }

vuex中的Login方法定义在 store/modules/user.js

  actions: {
    // 登录
    Login ({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
      })
    },
  }

基础概念：
外部通过store.state.{模块}.{变量}或store.getters.{变量}来读状态变量，
通过dispatch actions或mapActions的方式来调用action写状态，在action内部通过commit mutations间接修改state.

- state: 维护的数据。概念上应该是只读的（实际测试可以通过`store_.state.xxx=xxx`赋值），只可通过mutations中定义的方法来修改。
- getters: 计算属性（类似Vue的computed)，概念上应该是只读属性（实际测试如果它是指向state，也可以直接修改）
- mutations: 同步事件，外部通过`commit(事件名, 参数)`或`commit({type:事件名, ..})`来触发事件调用。
- actions: 事件，且通常是异步事件。外部（或store内部调用也可以）通过`dispatch(事件名, 参数)`来触发事件，在事件中，调用`commit`来修改状态。actions中定义的事件一般返回Promise，外部可通过then/catch/finally来处理，或使用await同步化。
- modules: 在这个里面定义的内容，如模块user(其中有个roles的state变量）, 可全局访问如 store.state.user.roles，也可通过getters定义一个只读属性来访问它 store.getters.roles，定义为：(store/getters.js)
            roles: state => state.user.roles,

## 全局变量注册

为调试方便，在main.js中注册了全局的Vue, store_, router_, app等全局变量。

示例：查看app中的store或router，查看store中的数据：

    app.$store.state.user.roles
    app.$store.state.user.roles.permissionList
    app.$store.getters.roles
    app.$route
    app.$router

示例：


