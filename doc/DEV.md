# 开发说明

## 编译机制

java的编译发布采用经典的Makefile方式，极轻量化且专用于筋斗云框架jdcloud-java。

- make: 编译，结果生成到classes目录
- make dist: 创建发布目录(将编译和资源复制到发布目录, 用于打包发布或推送线上)
- make publish: 提交发布目录git库，并通过git推送发布
- make clean: 清除内容

执行`make dist`命令，就将编译结果输出到指定的OUT_DIR目录（惯例为项目平级的xx-online目录，xx为项目名）。

执行`make publish`直接差量部署上线：（秒级升级，比传统拷贝war包高效很多）

在java/tool目录下封装了:

- war.mak: 生成war包（实际上只生成war目录，不去最终生成war文件，用于差量打包上线），部署于tomcat的java web应用。
 在java目录下的Makefile默认包含它。
- jar.mak: 生成jar包，用于命令行启动运行的生成java应用程序。
- publish.mak: 用于差量部署上线。

其中，war.mak包含了jar.mak，而jar.mak包含了publish.mak.

## 表格用法

Ant-Design表格封装，与筋斗云后端适配。

不直接设置dataSource属性，包括loading, change事件都被接管。
改用url, reload属性。设置`reload={}`则触发刷新。

支持查询条件和控制刷新：


	查询区：绑定queryParam中的字段

            <a-form-item label="列车编号">
              <a-input v-model="queryParam.code" placeholder=""/>
            </a-form-item>

查询按钮:

			<a-button type="primary" @click="loadData()">查询</a-button>
			<a-button @click="loadData(true)">重置</a-button>
			
列表:

	<JDTable :url="url" :columns="columns" :reload="reload" :queryParam="queryParam"></JDTable>

JS：

	import JDTable from '@/components/JDTable'

	...
	components: {
		JDTable,
	},
	data() {
		return {
			url: WUI.makeUrl("SensorData.query", {type: "A1"}),
			queryParam: {}, // 可缺省。额外查询条件
			reload: {}, // 设置为null或未设置url，则初始化时不会查询
			columns: [
				...
			]
		}
	}
	methods: {
		loadData(isReset){
			if (isReset)
				this.queryParam = {};
			this.reload = {}
		}
	}

- url: 新增属性。使用WUI.makeUrl创建url
- queryParam: 新增属性。用于绑定查询条件（最终将拼接到cond条件中）
- reload: 新增属性。用于触发刷新：`this.reload = {}`

事件：

- handleRow(row, i, data): 对列表行数据row做预处理。若要替换当前行，可以用`data[i] = newRow`

	<JDTable ... @handleRow="onHandleRow">

	methods: {
		onHandleRow(row, i, data) {
			// handle row
		}
	}


