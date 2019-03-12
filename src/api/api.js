import axios from 'axios'
import Qs from 'qs'

let base = '/CommodityTrade'

export const requestLogin = params => { return axios.post(`${base}/login`, Qs.stringify(params)).then(res => res.data); };

export const getOrderListPage = params => { return axios.get(`${base}/sys/order/page_by_param`, { params: params }); };

export const sendOut = params => { return axios.get(`${base}/sys/order/send_out`, { params: params }); };

export const deleteOrder = params => { return axios.get(`${base}/sys/order/delete`, { params: params }); };

export const updateOrder = params => { return axios.get(`${base}/sys/order/update`, { params: params }); };

export const logout = params => { return axios.get(`${base}/logout`, { params: params }); };