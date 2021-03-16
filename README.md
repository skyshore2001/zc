# zc - 管理端框架

- 后端 [筋斗云接口开发框架(java版): jdcloud-java](http://oliveche.com/jdcloud-site/jdcloud-java.html)
- 前端 [Ant Design Vue](https://www.antdv.com/docs/vue/introduce-cn/)
- 交互接口通用协议 [BQP - 业务查询协议](http://oliveche.com/jdcloud-site/BQP.html)

## 后端配置

### 数据库

创建数据库（假如数据库名为jdcloud）：

	create database jdcloud;

部署数据库表，无论创建或更新，均使用java/tool下的upgrade工具。
该工具需要php环境来运行，Windows下可[从这里下载php](http://oliveche.com/app/php-5.4.31-nts-Win32-VC9-x86-xdebug.zip)。
在git-bash中操作：

	cd java/tool
	./upgrade.sh initdb

创建默认管理员(admin/1234)，直接执行SQL：

	INSERT INTO `Employee` VALUES (1,'admin','12345678901','81dc9bdb52d04dc20036dbd8313ed055','admin','mgr');
	
### 加载Java项目

默认使用Eclipse加载java目录下的jdcloud和svc目录，运行在Tomcat服务上（目前用8.5版本）。
TODO: 如果使用IDEA工具，则需要些手工配置。

代码主文件默认为

	java/svc/src/com/demo/WebApi.java

进入 java/svc/WebContent/WEB-INF/ 修改配置。
将 web.properties.template 复制一份到 web.properties，修改其中的控制入口类以及数据库配置(`P_DB`，`P_DBCRED`等):

	# WebApi入口类：
	JDEnv=com.demo.WebApi

	# 数据库配置
	P_DBTYPE=mysql
	P_DB_DRIVER=com.mysql.jdbc.Driver
	P_DB=jdbc:mysql://localhost:3306/jdcloud?characterEncoding=utf8
	P_DBCRED=demo:demo123

注意：web.properties文件是部署时创建的，不要加到git库中。

关于部署上线，可参考doc/DEV.md文档中介绍。

## 前端配置

在h5/src/main.js中，通过serverUrl变量为后端地址，其默认值为"api/"，一般不用修改:

	let serverUrl = "api/";
	$.extend(WUI.options, {
	  serverUrl: serverUrl,
	  ...
	}

在开发环境中，通过 h5/vue.config.js 为"api/"指定代理，找到如下代码，按实际后端URL修改：

	devServer: {
		proxy: {
			'api/': {
				target: 'http://localhost:8080/qiche/api/',
				...
			}
		}
	}

前端运行：

	cnpm i
	cnpm run serve

一般会打开本机8000端口。在浏览器中访问：

	http://localhost:8000

登录：admin / 1234

默认antd中的演示页面都被隐藏了，如果要查看，可以用：

	http://localhost:8000/?debug=1

前端开发参考：

- [Ant Design Vue相关文档](https://www.antdv.com/components/table-cn/)
- doc/DEV.md 中有相关封装和开发惯例介绍。

