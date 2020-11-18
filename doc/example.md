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


