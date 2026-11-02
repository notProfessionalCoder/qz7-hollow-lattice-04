# 邮箱凭据配置（Gmail / Outlook）

Phase 1 的邮件汇总需要你自己在 Google 和微软那边各建一个「应用」，拿到客户端信息放在本机。

原则：

- 只申请**只读**权限（读邮件），发信等 Phase 3 再加，到时会单独确认
- 凭据和 token 只放本机：客户端文件放 `%APPDATA%\jarvis\`，登录后的 token 存 Windows 凭据管理器
- 这个仓库是公开的，**任何凭据都不要提交**（`.gitignore` 已经挡了常见文件名，但别依赖它）

完成后的目录：

```
%APPDATA%\jarvis\
  google_client.json      # 第一部分下载的文件
  config.toml             # 第二部分填的 Outlook client_id
```

---

## 一、Gmail（Google Cloud）

1. 打开 <https://console.cloud.google.com/>，左上角项目下拉 → **新建项目**，名字随意（例如 `jarvis-desktop`）。
2. 左侧 **API 和服务 → 库**，搜索 **Gmail API** → 启用。
3. **API 和服务 → OAuth 同意屏幕**（新版叫 Google Auth Platform → 品牌塑造）：
   - 用户类型选 **外部**
   - 应用名称、支持邮箱、开发者邮箱填你自己的
   - **数据访问 / 范围**：添加 `https://www.googleapis.com/auth/gmail.readonly`
   - **目标对象 / 测试用户**：把你自己的 Gmail 地址加进去
   - 发布状态保持 **测试**就行（只有你自己用；测试状态下 refresh token 7 天过期，到时重新登录一次，嫌麻烦可以之后再发布为正式）
4. **API 和服务 → 凭据 → 创建凭据 → OAuth 客户端 ID**：
   - 应用类型：**桌面应用**
   - 名称随意
5. 创建后点 **下载 JSON**，改名为 `google_client.json`，放到 `%APPDATA%\jarvis\`。

> 桌面应用类型的 client secret 按 Google 的设计不算真正的机密，但仍然别放进仓库。

## 二、Outlook（Microsoft Entra / Azure）

1. 打开 <https://entra.microsoft.com/>（或 Azure 门户），**应用注册 → 新注册**：
   - 名称：`jarvis-desktop`
   - 支持的账户类型：**任何组织目录中的账户和个人 Microsoft 账户**（个人 Outlook.com / Hotmail 需要选这个）
   - 重定向 URI：平台选 **公共客户端/本机（移动和桌面）**，填 `http://localhost`
2. 注册后进入该应用：
   - **身份验证** → 高级设置 → **允许公共客户端流** 设为 **是** → 保存
   - **API 权限 → 添加权限 → Microsoft Graph → 委托的权限**，勾选：
     - `Mail.Read`
     - `User.Read`
     - `offline_access`
   - 个人账户不需要「管理员同意」；首次登录时自己同意即可
3. 不需要创建客户端密码（桌面应用走 PKCE）。
4. 在 **概述** 页复制 **应用程序(客户端) ID**，写进 `%APPDATA%\jarvis\config.toml`：

```toml
[outlook]
client_id = "粘贴这里"
# 个人账户 + 工作账户都支持
authority = "https://login.microsoftonline.com/common"
```

## 三、首次登录

插件写好后，第一次启动会各弹一次浏览器让你登录并同意只读权限；之后 token 存在凭据管理器里自动刷新。想撤销：

- Google：<https://myaccount.google.com/permissions> 里移除该应用
- 微软：<https://account.live.com/consent/Manage>（个人账户）里移除

## 做完告诉我

两份都放好后说一声就行，不用把任何内容发给我。
