-- 开始事务
START TRANSACTION;

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO cards (id,menu_id,sub_menu_id,title,url,logo_url,custom_logo_path,`desc`,`order`) VALUES
	 (1,3,NULL,'YouTube','https://www.youtube.com','https://img.icons8.com/ios-filled/100/ff1d06/youtube-play.png',NULL,'全球最大的视频社区',0),
	 (4,6,NULL,'10分钟临时邮箱','https://linshiyouxiang.net','https://linshiyouxiang.net/static/index/zh/images/favicon.ico',NULL,'临时邮箱服务',0),
	 (5,3,NULL,'GitHub','https://github.com','',NULL,'全球最大男性交友平台',0),
	 (6,3,NULL,'IPSB','https://ip.sb','',NULL,NULL,0),
	 (7,3,NULL,'ITDOG','https://www.itdog.cn/tcping','',NULL,NULL,0),
	 (8,3,NULL,'PING0','https://ping0.cc/','',NULL,NULL,0),
	 (9,3,NULL,'API在线测试','https://hoppscotch.io/','',NULL,NULL,0),
	 (10,3,NULL,'NodeSeek','https://www.nodeseek.com/','',NULL,NULL,0),
	 (11,3,NULL,'LINUX DO','https://linux.do/','',NULL,NULL,0),
	 (12,3,NULL,'地址生成器','https://address.nnuu.nyc.mn/','',NULL,NULL,0);
INSERT INTO cards (id,menu_id,sub_menu_id,title,url,logo_url,custom_logo_path,`desc`,`order`) VALUES
	 (13,7,NULL,'Koyeb','https://app.koyeb.com/','',NULL,'无需绑卡',0),
	 (14,7,NULL,'railway','https://railway.com/','',NULL,NULL,0),
	 (15,7,NULL,'爪云','https://ap-northeast-1.run.claw.cloud/signin','',NULL,NULL,0),
	 (16,7,NULL,'猫云','https://cloud.cloudcat.one/signin','',NULL,NULL,0),
	 (17,7,NULL,'Hugging Face','https://huggingface.co/','',NULL,'大模型开源仓库',0),
	 (18,7,NULL,'Alwaysdata','https://admin.alwaysdata.com/','',NULL,NULL,0),
	 (19,7,NULL,'Vercel','https://vercel.com','',NULL,NULL,0),
	 (20,7,NULL,'SAP企业版','https://accounts.sap.com/oauth2/authorize?response_type=code&scope=openid+email+profile&redirect_uri=https%3A%2F%2Femea.cockpit.btp.cloud.sap%2Flogin%2Fcallback&client_id=28f1d77a-ce0d-401a-b926-e393cd8ed4fa&state=TJ_rsBOBJXHFXfNiv9o47Q&code_challenge=s394fYj5ottPzRdLIbhHuR4gwfh1HKO9cK1PPNFC60I&code_challenge_method=S256','',NULL,NULL,0),
	 (21,7,NULL,'SAP个人版','https://account.hanatrial.ondemand.com/trial/#/home/trial','',NULL,NULL,0),
	 (22,7,NULL,'Phala','https://phala.com/','',NULL,'免费400$',0);
INSERT INTO cards (id,menu_id,sub_menu_id,title,url,logo_url,custom_logo_path,`desc`,`order`) VALUES
	 (23,7,NULL,'大善人','https://dash.cloudflare.com/','',NULL,NULL,0),
	 (24,7,NULL,'leaflow','https://leaflow.net/','https://leaflow.net/build/assets/Logo-COIKldAv.png',NULL,'内测中,很好用',0),
	 (25,7,NULL,'Bot-Hosting','https://bot-hosting.net/','',NULL,'每日可领10金币',0),
	 (26,10,NULL,'ZoneABC','https://zoneabc.net/','',NULL,'1号5个域名,暂不可托管cf',0),
	 (27,10,NULL,'DPDNS','https://dash.domain.digitalplat.org/','https://dash.domain.digitalplat.org/static/img/logo.jpg',NULL,'可托管CF,半年一续期',0),
	 (28,5,NULL,'微测网','https://www.wetest.vip/','',NULL,NULL,0),
	 (29,8,NULL,'Proton','https://account.proton.me/apps','',NULL,NULL,0),
	 (30,8,NULL,'Gmail','https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&dsh=S-417644564%3A1759865358170663&emr=1&followup=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F&ifkv=AfYwgwVro-powUvbpXZFwfR1vjoaEp1-YsIRuou0iQi-CSHzj4wIld1_fD0qczgybpGnbI3ZGnF35A&osid=1&passive=1209600&service=mail&flowName=GlifWebSignIn&flowEntry=ServiceLogin','',NULL,NULL,0),
	 (31,8,NULL,'QQ邮箱','https://mail.qq.com/','',NULL,NULL,0),
	 (32,8,NULL,'2925无限邮箱','https://www.2925.com/login/','',NULL,NULL,0);
INSERT INTO cards (id,menu_id,sub_menu_id,title,url,logo_url,custom_logo_path,`desc`,`order`) VALUES
	 (33,8,NULL,'临时edu邮箱','https://tempmail.edu.kg/','',NULL,NULL,0),
	 (34,10,NULL,'土耳其短域名','https://www.site.ac/','',NULL,'不可托管CF,但直接可以重定向',0),
	 (35,10,NULL,'FreeDns42','https://freedns.42.pl/','',NULL,'波兰域名解析',0),
	 (36,8,NULL,'online-sim','https://online-sim.pro/zh/free-phone-number-447480734898','',NULL,NULL,0),
	 (37,5,1,'SVN托管','https://www.wsfdb.cn/a?login','免费的mysql',NULL,NULL,0),
	 (38,5,1,'SQLPub','https://sqlpub.com/','免费MYSQL',NULL,NULL,0);
INSERT INTO friends (id,title,url,logo) VALUES
	 (1,'Noodseek图床','https://www.nodeimage.com','https://www.nodeseek.com/static/image/favicon/favicon-32x32.png'),
	 (2,'Font Awesome','https://fontawesome.com','https://fontawesome.com/favicon.ico');
INSERT INTO menus (id,name,`order`) VALUES
	 (2,'Software',6),
	 (3,'Home',1),
	 (5,'Tools',5),
	 (6,'Other',8),
	 (7,'Container&Server',2),
	 (8,'Mail&SMS',4),
	 (9,'AI',3),
	 (10,'Domain',7);
INSERT INTO sub_menus (id,parent_id,name,`order`) VALUES
	 (1,5,'Dev Tools',1),
	 (3,2,'iOS',2),
	 (5,2,'Mac',1),
	 (6,2,'Windows',4),
	 (7,2,'Android',3);
INSERT INTO users (id,username,password,last_login_time,last_login_ip) VALUES
	 (1,'admin','$2b$10$543n4oqdtXl0HEg5mp1jP.F2gaWdfxU6mv5t9TPVJ8j70G0xvsxeu','2025-10-08 03:44:22','38.180.188.126');



-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 提交事务
COMMIT;