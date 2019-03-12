<template>
	<section>
		<!--工具条-->
		<el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
			<el-form :inline="true">
				<el-form-item>
					<el-input v-model="selectValue" placeholder="姓名" clearable></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" v-on:click="selectByName">查询</el-button>
				</el-form-item>
			</el-form>
		</el-col>

		<!--列表-->
		<el-table :data="orderList" highlight-current-row v-loading="listLoading" style="width: 100%;">
			<el-table-column type="selection" width="55"></el-table-column>
			<el-table-column prop="orderId" width="190" label="订单编号"></el-table-column>
			<el-table-column prop="buyerName" label="姓名" width="100" sortable></el-table-column>
			<el-table-column prop="buyerPhone" label="手机号" width="130" sortable></el-table-column>
			<el-table-column prop="buyerAddress" label="联系地址" min-width="180" sortable></el-table-column>
			<el-table-column prop="orderAmount" label="订单金额" width="120" sortable></el-table-column>
			<el-table-column prop="payStatus" label="支付状态" :formatter="formatPayStatus" width="120" sortable></el-table-column>
			<el-table-column prop="paymentTime" label="支付时间" :formatter="formatDate" width="200" sortable></el-table-column>
			<el-table-column prop="distribution" label="配送方式" :formatter="formatDistribution" width="120" sortable></el-table-column>
			<el-table-column prop="logisticsStatus" label="配送状态" width="150" sortable>
				<template scope="scope">
					<el-tag type="success" v-if="scope.row.distribution == 1 && scope.row.logisticsStatus == 1 && scope.row.payStatus == 1">已领取</el-tag>
					<el-tag type="danger" v-if="scope.row.distribution == 1 && scope.row.logisticsStatus == 0 && scope.row.payStatus == 1">未领取</el-tag>
					<el-tag type="success" v-if="scope.row.distribution == 2 && scope.row.logisticsStatus == 1 && scope.row.payStatus == 1">已发货</el-tag>
					<el-tag type="danger" v-if="scope.row.distribution == 2 && scope.row.logisticsStatus == 0 && scope.row.payStatus == 1">未发货</el-tag>
					<el-button type="info" size="small" v-show="scope.row.logisticsStatus == 0 && scope.row.distribution == 2 && scope.row.payStatus == 1" 
						@click="handleShipment(scope.$index, scope.row)">发货</el-button>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="150">
				<template scope="scope">
					<el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
					<el-button type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!--工具条-->
		<el-col :span="24" class="toolbar">
			<el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="pageSize" :total="total" style="float:right;"></el-pagination>
		</el-col>

		<!--编辑界面-->
		<el-dialog title="编辑" v-model="editFormVisible" :close-on-click-modal="true">
			<el-form :model="editForm" label-width="100px" :rules="editFormRules" ref="editForm">
				<el-form-item label="订单编号">
					<el-label>{{editForm.orderId}}</el-label>
				</el-form-item>
				<el-form-item label="姓名" prop="buyerName">
					<el-input v-model="editForm.buyerName" auto-complete="off"></el-input>
				</el-form-item>
				<el-form-item label="手机号" prop="buyerPhone">
					<el-input v-model="editForm.buyerPhone" ></el-input>
				</el-form-item>
				<el-form-item label="地址" prop="buyerAddress">
					<el-input v-model="editForm.buyerAddress"></el-input>
				</el-form-item>
				<el-form-item label="金额">
					<el-label>￥ {{editForm.orderAmount}}</el-label>
				</el-form-item>
				<el-form-item label="支付状态">
					<el-tag v-if="editForm.payStatus == 1" type="success">已支付</el-tag>
					<el-tag v-if="editForm.payStatus == 0" type="danger">未支付</el-tag>
				</el-form-item>
				<el-form-item label="支付时间" v-show="editForm.payStatus == 1">
					<el-label>{{formatDate(editForm)}}</el-label>
				</el-form-item>
				<el-form-item label="配送方式" v-show="editForm.payStatus == 1">
					<el-label v-if="editForm.distribution == 1">上门自取</el-label>
					<el-label v-if="editForm.distribution == 2">快递代发</el-label>
				</el-form-item>
				<el-form-item label="物流状态" v-show="editForm.payStatus == 1">
					<el-tag v-if="editForm.distribution == 1 && editForm.logisticsStatus == 1" type="success">已领取</el-tag>
					<el-tag v-if="editForm.distribution == 1 && editForm.logisticsStatus == 0" type="danger">未领取</el-tag>
					<el-tag v-if="editForm.distribution == 2 && editForm.logisticsStatus == 1" type="success">已发货</el-tag>
					<el-tag v-if="editForm.distribution == 2 && editForm.logisticsStatus == 0" type="danger">未发货</el-tag>
				</el-form-item>
			</el-form>
			<div slot="footer" class="dialog-footer">
				<el-button @click.native="editFormVisible = false">取消</el-button>
				<el-button type="primary" @click.native="editSubmit" :loading="editLoading">提交</el-button>
			</div>
		</el-dialog>
	</section>
</template>

<script>
	import util from '../../common/js/util'
	import { getOrderListPage, sendOut, updateOrder, deleteOrder } from '../../api/api'

	export default {
		data() {
			return {
				orderList: [],
				total: 0,
				pageNum: 1,
				pageSize: 20,
				listLoading: false,
				selectCode: '',
            	selectValue: '',
				editFormVisible: false,//编辑界面是否显示
				editLoading: false,
				editFormRules: {
					buyerName: [
						{ required: true, message: '请输入姓名', trigger: 'blur' }
					],
					buyerPhone: [
						{ required: true, message: '请输入手机号', trigger: 'blur' }
					],
					buyerAddress: [
						{ required: true, message: '请输入地址', trigger: 'blur' }
					]
				},
				//编辑界面数据
				editForm: {
					id: 0,
					name: '',
					sex: -1,
					age: 0,
					birth: '',
					addr: ''
				}
			}
		},
		mounted() {
			this.getOrderList()
		},
		methods: {
			getOrderList() {
				let para = {
					pageNum: this.pageNum,
					pageSize: this.pageSize,
					code: this.selectCode,
                	value: this.selectValue
				}
				this.listLoading = true
				getOrderListPage(para).then((res) => {
					console.log(res)
					this.total = res.data.data.total
					this.orderList = res.data.data.list
					this.listLoading = false
				})
			},
			//状态显示转换
			formatPayStatus: function (row, column) {
				return row.payStatus == 1 ? '已支付' : row.payStatus == 0 ? '未支付' : '未知'
			},
			formatDate: function(row, column) {
				return row.paymentTime ? util.formatDate.format(new Date(row.paymentTime), 'yyyy-MM-dd hh:mm:ss') : ''
			},
			formatDistribution: function(row, column) {
				return (row.payStatus == 1 && row.distribution == 1) ? '上门自取' : (row.payStatus == 1 && row.distribution == 2) ? '快递代发' : row.payStatus == 1 ? '未知' : ''
			},
			formatLogisticsStatus: function(row, column) {
				return row.logisticsStatus == 1 ? '已发货' : row.logisticsStatus == 0 ? '未发货' : '未知'
			},
			selectByName() {
				this.selectCode = 'buyerName'
				this.getOrderList()
			},
			handleCurrentChange(val) {
				this.pageNum = val
				this.getOrderList()
			},
			// 发货提示
			handleShipment(index, row) {
				this.$confirm('确认发货吗?', '提示', {
					type: 'info'
				}).then(() => {
					this.listLoading = true
					let param = { orderId: row.orderId }
					sendOut(param).then((res) => {
						this.listLoading = false
						this.$message({
							message: '发货成功',
							type: 'success'
						})
						this.getOrderList()
					})
				}).catch(() => {

				})
			},
			
			//删除
			handleDel: function (index, row) {
				this.$confirm('确认删除该记录吗?', '提示', {
					type: 'warning'
				}).then(() => {
					this.listLoading = true
					let param = { orderId: row.orderId }
					deleteOrder(param).then((res) => {
						this.listLoading = false
						this.$message({
							message: '删除成功',
							type: 'success'
						})
						this.getOrderList()
					})
				}).catch(() => {

				})
			},
			//显示编辑界面
			handleEdit: function (index, row) {
				this.editFormVisible = true
				this.editForm = Object.assign({}, row)
			},
			//编辑
			editSubmit: function () {
				this.$refs.editForm.validate((valid) => {
					if (valid) {
						this.$confirm('确认提交吗？', '提示', {}).then(() => {
							this.editLoading = true
							let param = Object.assign({}, this.editForm)
							updateOrder(param).then((res) => {
								this.editLoading = false
								this.$message({
									message: '提交成功',
									type: 'success'
								})
								this.$refs['editForm'].resetFields()
								this.editFormVisible = false
								this.getOrderList()
							})
						})
					}
				})
			}
		}
	}

</script>

<style scoped>

</style>