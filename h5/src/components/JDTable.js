/**
@class JDTable

Ant-Design表格封装，与筋斗云后端适配。

	<JDTable :url="url" :columns="columns"></JDTable>

	data: {
		url: WUI.makeUrl("SensorData.query", {type: "A1"}),
		columns: [
			...
		]
	}

- url: 新增属性。使用WUI.makeUrl创建url

如果要加查询条件和控制刷新：

	<a-form-item label="车辆编码">
		<a-input v-model="queryParam.code" placeholder="" />
	</a-form-item>
	<a-form-item label="行驶状态">
		<JDSelect :jdEnumMap="RunFlagMap" v-model="queryParam.runFlag" />
	</a-form-item>
	<a-button type="primary" @click="loadData()">查询</a-button>
	<a-button @click="loadData(true)">重置</a-button>

	<JDTable :url="url" :columns="columns" :reload="reload" :queryParam="queryParam">
		<template v-slot:details="item">
			<a href="javascript:;" @click="toVehicleDetail(item)">详情</a>
		</template>
		<template v-slot:exList="exList">
			<span :title="exList">{{exList}}</span>
		</template>
	</JDTable>

	data: {
		url: WUI.makeUrl("SensorData.query", {type: "A1"}),
		queryParam: {}, // 可缺省。额外查询条件
		reload: {}, // 设置为null或未设置url，则初始化时不会查询
		columns: [
			{ title: '编号', dataIndex: 'id', sorter: true },
			{ title: '车辆编码', dataIndex: 'code', sorter: true },
			{ title: '行驶状态', dataIndex: 'runFlag', sorter: true, width:100, jdEnumMap:RunFlagMap, jdEnumStyler:RunFlagStyler},
			{ title: '异常情况', dataIndex: 'exList', sorter: false, scopedSlots:{customRender:'exList'} },
			{ title: '操作', dataIndex: '', sorter: false, align:'center', width:100, scopedSlots:{customRender:'details'} },
		]
	}
	methods: {
		// isReset?
		loadData(isReset){
			if (isReset)
				this.queryParam = {};
			this.reload = {}
		},
	}

- queryParam: 新增属性。用于绑定查询条件（最终将拼接到cond条件中）
- reload: 新增属性。用于触发刷新：`this.reload = {}`

指定缺省排序字段defaultSortOrder, 指定缺省过滤defaultFilteredValue（可以设置多个字段），示例：

			{ title: '编号', dataIndex: 'id', sorter: true , defaultSortOrder:'descend'},
			{ title: '行驶状态', dataIndex: 'runFlag', sorter: true, width:100, jdEnumMap:RunFlagMap, jdEnumStyler:RunFlagStyler, defaultFilteredValue:['0']},

事件：

- handleRow(row, i, data): 对列表行数据row做预处理。若要替换当前行，可以用`data[i] = newRow`

	<a-table ... @handleRow="onHandleRow">

	methods: {
		onHandleRow(row, i, data) {
			// handle row
		}
	}

 */

import {Table} from 'ant-design-vue'
// const Table = Vue.options["components"]["ATable"].options
WUI.options.PAGE_SZ = 10;

Table.props.pagination.default = function () {
	return {
		showSizeChanger: true,
		showQuickJumper: true,
		defaultPageSize: WUI.options.PAGE_SZ,
		pageSizeOptions: ["10", "20", "50"],
		showTotal: (total, range) => `第${range[0]}-${range[1]}条，共${total}条`
	}
}

// JSX: https://xie.infoq.cn/article/6af7782f35bfe69f25548470e
var JDSelect = {
	props: ["jdEnumMap"],
	model: {
		prop: 'value',
		event: 'change'
	},
	render() {
		var map = this.jdEnumMap;
		var options = $.map(map, (v, k) => {return {value: k, label: v}});
		options.unshift({value: "", label: "(全部)"}); // TODO: 不能为空白?
//		console.log(this.$attrs);

		var on = {...this.$listeners};
		return <a-select attrs={ this.$attrs } on={on} options={options}></a-select>
	}
}

var JDTable = {
	name: "JDTable",
	props: {
		url: String,
		queryParam: Object,
		reload: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data: function () {
		return {
			loading: false,
			dataSource: null,

			pagination: Table.props.pagination.default(),
			filters: null,
			sorter: null,
		}
	},
	watch: {
		url(val) {
			this.loadData()
		},
		reload(val) {
			this.pagination.current = 1;
			this.loadData()
		}
	},
	render() {
		var on = {...this.$listeners}; // NOTE: 必须复制一份，否则$listener中反复加入onChange导致死循环
		return <Table attrs={this.$attrs} on={on} scopedSlots={this.$scopedSlots}
			loading={this.loading}
			pagination={this.pagination}
			dataSource={this.dataSource}
			rowKey="id"
			onChange={this.onChange}
		/>
	},
	created() {
		var cols = this.$attrs.columns;
		if (cols) {
			cols.forEach(col => {
				if (col.jdEnumMap) {
					col.filters = $.map(col.jdEnumMap, (v, k) => { return {text: v, value: k} });
				}
				if (col.jdEnumStyler) {
					col.customRender = function (val, row, i) {
						var color = col.jdEnumStyler && col.jdEnumStyler[val] || '';
						var text = col.jdEnumMap && col.jdEnumMap[val] || val;
						return <a-tag color={color}>{text}</a-tag>;
					}
				}
				if (col.defaultSortOrder) {
					this.sorter = {columnKey: col.dataIndex, order: col.defaultSortOrder};
				}
				if (col.defaultFilteredValue) {
					if (this.filters == null)
						this.filters = {};
					this.filters[col.dataIndex] = col.defaultFilteredValue;
				}
			});
		}
	},
	mounted() {
		if (this.reload) {
			this.onChange()
		}
	},
	methods: {
/**
@fn loadData()
 */
		loadData() {
			this.onChange();
		},
/**
@fn getQueryParam(wantRes?)

取表格上当前关联的查询条件。
 */
		getQueryParam(wantRes) {
			let param = {};
			let filters = {};
			if (this.filters)
				$.each(this.filters, (k, v) => { filters[k] = v.join(',') });
			let cond = WUI.getQueryCond({...this.queryParam, ...filters})
			if (cond) {
				if (this.url.params && this.url.params.cond) {
					param.cond = this.url.params.cond + " AND (" + cond + ")"
				}
				else {
					param.cond = cond
				}
			}
			if (this.sorter && this.sorter.columnKey) {
				param.orderby = this.sorter.columnKey + (this.sorter.order == "descend"? " DESC": " ASC");
			}

			if (wantRes) {
				var res = '';
				this.$attrs.columns.forEach(col => {
					if (!col.dataIndex || col.dataIndex.substr(-1) == '_')
						return;
					if (res.length > 0)
						res += ',';
					res += col.dataIndex + " \"" + col.title + "\"";
					if (col.jdEnumMap) {
						res += '=' + WUI.kvList2Str(col.jdEnumMap, ';', ':');
					}
				});
				if (res)
					param.res = res;
			}
			return param;
		},
		async onChange (pagination, filters, sorter) {
			if (this.url == null)
				return;
			this.filters = filters || this.filters;
			this.sorter = sorter || this.sorter;

			var param = this.getQueryParam();
			var pi = pagination || this.pagination;
			param.page = pi.current || 1;
			param.pagesz = pi.pageSize;

			this.loading = true
			let data = await callSvr(this.url, param)
				.finally( () => this.loading = false)

			this.pagination = {
				...pi,
				total: data.total
			}
			let data1 = WUI.rs2Array(data)
			data1.forEach((row, i) => {
				this.$emit("handleRow", row, i, data1)
			})
			this.dataSource = data1;
		},
/**
@fn exportData(fname?)

列表导出到Excel文件
 */
		exportData(fname){
			var param = this.getQueryParam(true);
			var obj = this.url && this.url.action.replace(/\..*/, '');
			$.extend(param, {
				fmt:'excel',
				fname: fname || obj,
				pagesz: -1
			});
			let url = WUI.makeUrl(this.url, param);
			window.open(url);
//			callSvr(url);
		},
	},
	install(Vue) {
		Vue.component("JDTable", JDTable)
		Vue.component("JDSelect", JDSelect)
	}
}

export default JDTable
