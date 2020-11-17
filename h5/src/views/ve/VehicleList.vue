<template>
	<a-card :bordered="false">
		<div class="table-page-search-wrapper">
			<a-form layout="inline">
				<a-row :gutter="48">
					<a-col :md="6" :sm="24">
						<a-form-item label="车辆编号">
							<a-input v-model="queryParam.code" placeholder="" />
						</a-form-item>
					</a-col>
					<a-col :md="6" :sm="24">
						<a-form-item label="列车编号">
							<a-input v-model="queryParam.hubCode" placeholder="" />
						</a-form-item>
					</a-col>
					<template v-if="advanced">
						<a-col :md="6" :sm="24">
							<a-form-item label="车辆异常">
								<JDSelect defaultValue="" v-model="queryParam.exFlag" :jdEnumMap="YesNoMap" />
							</a-form-item>
						</a-col>
						<a-col :md="6" :sm="24">
							<a-form-item label="行驶里程">
								<a-input v-model="queryParam['总里程']" placeholder="" />
							</a-form-item>
						</a-col>
						<a-col :md="6" :sm="24">
							<a-form-item label="行驶状态">
								<JDSelect :jdEnumMap="RunFlagMap" v-model="queryParam.runFlag" />
							</a-form-item>
						</a-col>
						<a-col :md="6" :sm="24">
							<a-form-item label="异常次数">
								<a-input v-model="queryParam.exCnt" placeholder="" />
							</a-form-item>
						</a-col>
						<a-col :md="6" :sm="24">
							<a-form-item label="维修次数">
								<a-input v-model="queryParam.repairCnt" placeholder="" />
							</a-form-item>
						</a-col>
					</template>
					<a-col :md="!advanced && 8 || 24" :sm="24">
						<span class="table-page-search-submitButtons" :style="advanced && { float: 'right', overflow: 'hidden' } || {} ">
							<a-button type="primary" @click="loadData()">查询</a-button>
							<a-button style="margin-left: 8px" @click="loadData(true)">重置</a-button>
							<a @click="toggleAdvanced" style="margin-left: 8px">
								{{ advanced ? '收起' : '展开' }}
								<a-icon :type="advanced ? 'up' : 'down'" />
							</a>
						</span>
					</a-col>
				</a-row>
			</a-form>
		</div>

		<div class="table-operator">
			<a-button type="primary" icon="plus" @click="toVehicleList">新建</a-button>
			<a-button icon="arrow-down" @click="$refs.tbl.exportData('车辆列表')">导出</a-button>
		</div>

		<JDTable ref="tbl" class="tableTemplate" :url="url" :queryParam="queryParam" :columns="columns" :reload="reload" :scroll="{x:1500}" @handleRow="onHandleRow">
			<template v-slot:details="item">
				<a href="javascript:;" @click="toVehicleDetail(item)">详情</a>
			</template>
			<template v-slot:exList="exList">
				<span :title="exList">{{exList}}</span>
			</template>
		</JDTable>
	</a-card>
</template>

<script>

var YesNoMap = {
	0: "否",
	1: "是"
};

var RunFlagMap = {
	0: "停止",
	1: "行驶中"
};

export default {
	data(){
		return {
			// 高级搜索 展开/关闭
			advanced: false,
			url: WUI.makeUrl("Vehicle.query",{orderby:'id DESC'}),
			reload: {},
			queryParam:{},
			RunFlagMap,
			YesNoMap,
			// 表头
			columns: [
				{ title: '编号', dataIndex: 'id', sorter: true },
				{ title: '车辆编号', dataIndex: 'code', sorter: true },
				{ title: '列车编号', dataIndex: 'hubCode', sorter: true },
				{ title:'车辆型号', dataIndex: '型号', sorter:true },
				{ title: '车辆状态', dataIndex: 'exList', sorter: false, scopedSlots:{customRender:'exList'} },
				{ title: '行驶里程', dataIndex: '总里程', sorter: true, width:120 },
				{ title: '行驶状态', dataIndex: 'runFlag', sorter: false, width:100, jdEnumMap:RunFlagMap, jdEnumStyler:{1: 'green', 0: 'red'}},
				{ title: '异常次数', dataIndex: 'exCnt', sorter: false, width:100, sorter: true },
				{ title: '维修次数', dataIndex: 'repairCnt', sorter: false, width:100, sorter: true },
				{ title: '健康诊断', dataIndex: 'anaResult', sorter: false },
				{ title: '操作', dataIndex: '', sorter: false, /* fixed:'right', */align:'center', width:100, scopedSlots:{customRender:'details'} },
			],
		}
	},
	methods:{
		toVehicleDetail(item){
			this.$router.push({
				path:'/ve/vehicleDetail',
				query:{
					id:item.id
				}
			})
		},
		toVehicleList(){
			this.$router.push({path:'/ve/vehicleAdd'})
		},
		onHandleRow(row, i, data) {
			let d = row
			d.exList = (d.exList && d.exList.map(e => e.name).join(',')) || "车辆正常";
			if(d.anaResult.length > 0){
				let str = '';
				d.anaResult.forEach((y) => {
						str += (y.name + ',');
				})
				d.anaResult = str.substr(0,str.length - 1);
			} else {
				d.anaResult = '车辆健康';
			}
		},
		// isReset?
		loadData(isReset){
			if (isReset)
				this.queryParam = {};
			this.reload = {}
		},
		toggleAdvanced () {
			this.advanced = !this.advanced;
		},
	},
	created(){
		if(this.$route.query.runFlag != null){
			this.queryParam.runFlag = this.$route.query.runFlag;
		}
		if(this.$route.query.hubCode != null){
			this.queryParam.hubCode = this.$route.query.hubCode;
		}
	}
}
</script>

<style lang="less" scoped>
	.tableTemplate /deep/ table{
		width:100% !important;
	}

	.tableTemplate /deep/ td{
		padding:16px 8px;
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tableTemplate /deep/ th{
		padding:16px 8px;
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>

