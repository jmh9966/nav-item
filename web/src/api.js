// web/src/api.js
import axios from 'axios';

const BASE = '/api';

// 获取认证头
function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// ======================
// 认证
// ======================
export const login = (username, password) =>
  axios.post(`${BASE}/auth`, { username, password });

// ======================
// 菜单（主菜单）
// ======================
export const getMenus = () => axios.get(`${BASE}/menu`);

export const addMenu = (data) =>
  axios.post(`${BASE}/menu`, data, { headers: authHeaders() });

export const updateMenu = (id, data) =>
  axios.put(`${BASE}/menu?id=${id}`, data, { headers: authHeaders() });

export const deleteMenu = (id) =>
  axios.delete(`${BASE}/menu?id=${id}`, { headers: authHeaders() });

// ======================
// 子菜单
// ======================
export const getSubMenus = (parentId) =>
  axios.get(`${BASE}/submenus`, { params: { parentId } });

export const addSubMenu = (parentId, data) =>
  axios.post(`${BASE}/submenus`, data, {
    params: { parentId },
    headers: authHeaders(),
  });

export const updateSubMenu = (id, data) =>
  axios.put(`${BASE}/submenus?id=${id}`, data, { headers: authHeaders() });

export const deleteSubMenu = (id) =>
  axios.delete(`${BASE}/submenus?id=${id}`, { headers: authHeaders() });

// ======================
// 卡片
// ======================
export const getCards = (menuId, subMenuId = null) => {
  const params = subMenuId ? { menuId, subMenuId } : { menuId };
  return axios.get(`${BASE}/card`, { params });
};

export const addCard = (data) =>
  axios.post(`${BASE}/card`, data, { headers: authHeaders() });

export const updateCard = (id, data) =>
  axios.put(`${BASE}/card?id=${id}`, data, { headers: authHeaders() });

export const deleteCard = (id) =>
  axios.delete(`${BASE}/card?id=${id}`, { headers: authHeaders() });

// ======================
// 广告
// ======================
export const getAds = () => axios.get(`${BASE}/ad`);

export const addAd = (data) =>
  axios.post(`${BASE}/ad`, data, { headers: authHeaders() });

export const updateAd = (id, data) =>
  axios.put(`${BASE}/ad?id=${id}`, data, { headers: authHeaders() });

export const deleteAd = (id) =>
  axios.delete(`${BASE}/ad?id=${id}`, { headers: authHeaders() });

// ======================
// 友链
// ======================
export const getFriends = () => axios.get(`${BASE}/friends`);

export const addFriend = (data) =>
  axios.post(`${BASE}/friends`, data, { headers: authHeaders() });

export const updateFriend = (id, data) =>
  axios.put(`${BASE}/friends?id=${id}`, data, { headers: authHeaders() });

export const deleteFriend = (id) =>
  axios.delete(`${BASE}/friends?id=${id}`, { headers: authHeaders() });

// ======================
// 用户
// ======================
export const getUserProfile = () =>
  axios.get(`${BASE}/user/profile`, { headers: authHeaders() });

export const getUserMe = () =>
  axios.get(`${BASE}/user/me`, { headers: authHeaders() });

export const changePassword = (oldPassword, newPassword) =>
  axios.put(
    `${BASE}/user/password`,
    { oldPassword, newPassword },
    { headers: authHeaders() }
  );

export const getUsers = () =>
  axios.get(`${BASE}/user`, { headers: authHeaders() });