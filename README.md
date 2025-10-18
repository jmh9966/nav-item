---
title: Nav
emoji: 🦀
colorFrom: purple
colorTo: yellow
sdk: docker
pinned: false
short_description: 一个现代化的导航网站项目，提供简洁美观的导航界面和强大的后台管理系统,快速访问常用网站和工具
app_port: 3000
---

# Nav-item - 个人导航站

## 项目简介

一个现代化的导航网站项目，提供简洁美观的导航界面和强大的后台管理系统,快速访问常用网站和工具,代码来源于[eooce](https://github.com/eooce),在此基础上将SQLite改为MYSQL持久化并以vercel部署网站

## 🛠️ 技术栈
- Vue 3 + Node.js +MYSQL 前后端分离架构

## ✨ 主要功能

### 前端功能
- 🏠 **首页导航**：美观的卡片式导航界面
- 🔍 **聚合搜索**：支持 Google、百度、Bing、GitHub、站内搜索
- 📱 **响应式设计**：完美适配桌面端和移动端
- 🎨 **现代化UI**：采用渐变背景和毛玻璃效果
- 🔗 **友情链接**：支持友情链接展示
- 📢 **广告位**：支持左右两侧广告位展示

### 后台管理功能
- 👤 **用户管理**：管理员登录、用户信息管理
- 📋 **栏目管理**：主菜单和子菜单的增删改查
- 🃏 **卡片管理**：导航卡片的增删改查
- 📢 **广告管理**：广告位的增删改查
- 🔗 **友链管理**：友情链接的增删改查
- 📊 **数据统计**：登录时间、IP等统计信息

### 技术特性
- 🔐 **JWT认证**：安全的用户认证机制
- 🗄️ **SQLite数据库**：轻量级数据库，无需额外配置
- 📤 **文件上传**：支持图片上传功能
- 🔍 **搜索功能**：支持站内搜索和外部搜索
- 📱 **移动端适配**：完美的移动端体验

## 🏗️ 项目结构

```css
nav-item-vercel
├─ config.js
├─ LICENSE
├─ package.json
├─ README.md
├─ vercel.json
├─ web
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ vite.config.mjs
│  ├─ src
│  │  ├─ api.js
│  │  ├─ App.vue
│  │  ├─ main.js
│  │  ├─ router.js
│  │  ├─ views
│  │  │  ├─ Admin.vue
│  │  │  ├─ Home.vue
│  │  │  └─ admin
│  │  │     ├─ AdManage.vue
│  │  │     ├─ CardManage.vue
│  │  │     ├─ FriendLinkManage.vue
│  │  │     ├─ MenuManage.vue
│  │  │     └─ UserManage.vue
│  │  └─ components
│  │     ├─ CardGrid.vue
│  │     └─ MenuBar.vue
│  └─ public
│     ├─ background.webp
│     ├─ default-favicon.png
│     └─ robots.txt
├─ uploads
│  └─ default-favicon.png
├─ sql
│  ├─ init_data.sql
│  └─ init_table.sql
├─ lib
│  ├─ auth.js
│  ├─ db.js
│  └─ libuserUtils.js
├─ assets
│  ├─ 1.jpg
│  └─ 7.jpg
└─ api
   ├─ ad.js
   ├─ auth.js
   ├─ card.js
   ├─ friends.js
   ├─ menu.js
   ├─ submenus.js
   ├─ upload.js
   └─ user
      ├─ index.js
      ├─ me.js
      ├─ password.js
      └─ profile.js

```

## ⚙️ 环境变量及配置说明

### 环境变量
|     变量名     |           变量值            | 非空  |
| :------------: | :-------------------------: | :---: |
|      PORT      | 服务器端口号（默认: 3000）  | FALSE |
| ADMIN_USERNAME | 管理员用户名（默认: admin） | FALSE |
| ADMIN_PASSWORD | 管理员密码（默认: 123456）  | FALSE |
|   JWT_SECRET   |          令牌密钥           | FALSE |
|   MYSQL_HOST   |        MYSQL主机地址        | TRUE  |
|   MYSQL_USER   |         MYSQL用户名         | TRUE  |
| MYSQL_PASSWORD |         数据库密码          | TRUE  |
| MYSQL_DATABASE |          数据库名           | TRUE  |



## 🚀 部署指南

### 源代码部署

#### 1. 克隆项目

```bash
git clone https://github.com/j996610541123/nav-item-vercel.git
cd nav-item-vercel
```

#### 2. 安装后端依赖

```bash
npm install
```

#### 3. 构建前端
```bash
cd web && npm install && npm run build
```

#### 4. 启动后端服务
```bash
# 在项目根目录
cd .. && npm start
```

#### 6. 访问应用
- 前端地址：http://localhost:3000
- 后台管理：http://localhost:3000/admin
- 默认管理员账号：admin / 123456



### VERCEL部署

#### 1.Fork 本仓库

#### 2.执行sql文件夹下的sql脚本

#### 2.导入此项目到vercel

#### 3.部署环境设置

- **Build Command: **cd web && npm install && npm run build
- **Output Directory: **./web/dist

#### 4.环境变量配置(如上)

#### 5.访问应用

- ververl给出的地址:  nav-nine-tau.vercel.app(示例)
- 后台管理：nav-nine-tau.vercel.app/admin
- 默认管理员账号：admin / 123456

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

**eooce** - [GitHub](https://github.com/eooce)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 
