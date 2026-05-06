# Super798 — 798 净水无广告版

> **⚠️ 免责声明：本项目仅供学习交流使用，请于下载后 24 小时内删除。严禁用于任何商业用途。如有侵权，请联系删除。**

Super798 是 [iLife798](https://i.ilife798.com) 净水 App 的第三方无广告客户端，去除了原版中的广告与推广内容，提供更纯净的使用体验。

---

## 📖 目录

- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [环境准备](#环境准备)
- [本地开发](#本地开发)
- [打包教程](#打包教程)
  - [Android APK 打包](#android-apk-打包)
  - [iOS IPA 打包（本地）](#ios-ipa-打包本地)
  - [iOS IPA 打包（GitHub Actions 自动构建）](#ios-ipa-打包github-actions-自动构建)
- [后端代理服务](#后端代理服务)
- [免责声明](#免责声明)

---

## 功能特性

- 🚫 **无广告** — 去除原版所有广告和推广弹窗
- 📱 **跨平台** — 同时支持 iOS 和 Android
- 🔒 **安全登录** — 短信验证码登录，Token 本地安全存储
- 📊 **接水记录** — 本地记录每次接水数据
- ⭐ **设备收藏** — 快速收藏常用净水设备
- 📷 **扫码连接** — 扫描设备二维码快速连接

---

## 项目结构

```
Super798App/
├── src/                    # 前端源码（React Native + Expo）
│   ├── app/                # 路由页面（expo-router）
│   │   ├── (tabs)/         # 底部 Tab 导航页
│   │   ├── _layout.tsx     # 根布局
│   │   ├── login.tsx       # 登录页
│   │   └── settings.tsx    # 设置页
│   ├── screens/            # 业务页面
│   │   ├── DevicesScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── context/            # React Context（全局状态）
│   ├── lib/                # 工具库
│   │   ├── api.ts          # API 请求封装
│   │   ├── storage.ts      # 本地存储
│   │   └── utils.ts        # 通用工具函数
│   └── ProbeApp.tsx        # 启动探针（调试用）
├── main.py                 # 后端代理服务（FastAPI）
├── app.json                # Expo 配置
├── eas.json                # EAS Build 配置
├── package.json            # Node.js 依赖
├── .github/workflows/      # GitHub Actions 自动构建
│   └── build-unsigned-ipa.yml
└── exportOptions.unsigned.plist
```

---

## 环境准备

### 基础依赖

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | >= 20 | JavaScript 运行时 |
| **npm** | >= 9 | 包管理器（随 Node.js 安装） |
| **Expo CLI** | 最新版 | `npm install -g expo-cli` |
| **EAS CLI** | >= 18.4.0 | `npm install -g eas-cli` |

### iOS 打包额外依赖（仅 macOS）

| 工具 | 说明 |
|------|------|
| **Xcode** | >= 15，从 App Store 安装 |
| **CocoaPods** | `sudo gem install cocoapods` |
| **Apple 开发者证书** | .p12 证书 + .mobileprovision 描述文件 |

### Android 打包额外依赖

| 工具 | 说明 |
|------|------|
| **Android Studio** | 包含 Android SDK |
| **JDK** | >= 17 |

### 后端代理依赖（可选）

| 工具 | 说明 |
|------|------|
| **Python** | >= 3.10 |
| **pip 依赖** | `fastapi`, `uvicorn`, `httpx` |

---

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/Super798App.git
cd Super798App
```

### 2. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 3. 启动开发服务

```bash
npx expo start
```

启动后会看到一个二维码，可以用 **Expo Go** App 扫码在手机上实时预览，或按提示键在模拟器中运行：
- 按 `i` — 打开 iOS 模拟器
- 按 `a` — 打开 Android 模拟器
- 按 `w` — 在浏览器中打开

---

## 打包教程

### Android APK 打包

#### 方法一：EAS Build（云端构建，推荐）

1. 登录 Expo 账号：

```bash
npx eas login
```

2. 构建 APK（preview 配置会生成可直接安装的 APK）：

```bash
npx eas build --platform android --profile preview
```

3. 构建完成后，EAS 会提供一个下载链接，下载 `.apk` 文件即可安装。

#### 方法二：本地构建

1. 生成 Android 原生工程：

```bash
npx expo prebuild --platform android --clean
```

2. 进入 Android 目录并构建：

```bash
cd android
./gradlew assembleRelease
```

3. 输出的 APK 文件位于：

```
android/app/build/outputs/apk/release/app-release.apk
```

4. 将 APK 传到手机上安装即可。

> **提示**：如果需要签名 APK，请在 `android/app/build.gradle` 中配置 `signingConfigs`，或使用 `apksigner` 工具手动签名。

---

### iOS IPA 打包（本地）

> ⚠️ 需要 **macOS** + **Xcode** 环境

#### 步骤一：生成原生工程

```bash
npx expo prebuild --platform ios --clean
```

#### 步骤二：安装 CocoaPods 依赖

```bash
cd ios
pod install
cd ..
```

#### 步骤三：使用 Xcode 打包

1. 用 Xcode 打开 `ios/Super798.xcworkspace`：

```bash
open ios/Super798.xcworkspace
```

2. 在 Xcode 中：
   - 选择顶部菜单 **Product → Scheme → Super798**
   - 选择目标设备为 **Any iOS Device (arm64)**
   - 进入 **Signing & Capabilities**，配置你的证书和描述文件
   - 选择 **Product → Archive**

3. Archive 完成后，在弹出的 Organizer 窗口中：
   - 点击 **Distribute App**
   - 选择 **Development** 或 **Ad Hoc**（根据你的证书类型）
   - 导出 `.ipa` 文件

#### 步骤四（可选）：命令行打包

```bash
# 构建 Archive
xcodebuild archive \
  -workspace ios/Super798.xcworkspace \
  -scheme Super798 \
  -configuration Release \
  -archivePath build/Super798.xcarchive \
  -destination 'generic/platform=iOS' \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="你的签名证书名称" \
  DEVELOPMENT_TEAM="你的TeamID" \
  PROVISIONING_PROFILE_SPECIFIER="你的描述文件名称"

# 导出 IPA
xcodebuild -exportArchive \
  -archivePath build/Super798.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist exportOptions.unsigned.plist
```

导出的 IPA 位于 `build/ipa/Super798.ipa`。

---

### iOS IPA 打包（GitHub Actions 自动构建）

本项目已配置 GitHub Actions 自动构建流程，推送到 `main` 分支即可自动触发。

#### 前置准备

1. 在项目根目录下创建证书目录（已在 workflow 中指定）：

```
证书_00008120-000908403A31A01E/
├── 你的证书.p12
├── 你的描述文件.mobileprovision
└── 密码.txt          # 内容格式：密码:你的p12密码
```

2. 将证书目录提交到仓库（**注意：私有仓库才安全**）。

#### 触发构建

- **自动触发**：推送代码到 `main` 分支
- **手动触发**：在 GitHub 仓库页面 → Actions → `build-unsigned-ipa` → **Run workflow**

#### 下载产物

构建成功后：
1. 进入 GitHub 仓库 → **Actions** 页面
2. 点击最新的构建记录
3. 在页面底部 **Artifacts** 区域下载 `signed-ipa`
4. 解压得到 `Super798.ipa`

#### 安装 IPA 到手机

| 方式 | 适用场景 |
|------|---------|
| **AltStore / SideStore** | 免费 Apple ID 侧载 |
| **TrollStore** | 越狱 / 支持 TrollStore 的系统版本 |
| **Xcode → Devices** | 开发者账号直接安装 |
| **牛蛙助手 / 爱思助手** | Windows 用户侧载工具 |
| **签名工具** | 使用企业证书重签后分发 |

---

## 后端代理服务

项目包含一个 FastAPI 后端代理（`main.py`），用于转发请求到 798 官方 API 并记录接水数据。

### 启动方式

```bash
# 安装 Python 依赖
pip install fastapi uvicorn httpx

# 启动服务
python main.py
```

服务默认运行在 `http://0.0.0.0:7981`。

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/captcha` | GET | 获取验证码图片 |
| `/login/code` | POST | 发送短信验证码 |
| `/login` | POST | 登录 |
| `/devices` | GET | 获取设备列表 |
| `/device/status` | GET | 获取设备状态 |
| `/device/start` | GET | 开始接水 |
| `/device/end` | GET | 结束接水 |
| `/records` | GET | 查询接水记录 |

---

## 常见问题

### Q: iOS 安装后闪退？

检查以下几点：
1. 证书是否已过期
2. 描述文件中是否包含你的设备 UDID
3. 是否信任了开发者证书（设置 → 通用 → VPN与设备管理）

### Q: `npm install` 报错？

尝试加上 `--legacy-peer-deps` 参数：
```bash
npm install --legacy-peer-deps
```

### Q: `expo prebuild` 报错？

确保 Expo CLI 版本与 `package.json` 中 `expo` 版本兼容：
```bash
npx expo-doctor
```

---

## 免责声明

> **⚠️ 重要 — 请务必仔细阅读**

1. **仅供学习交流**：本项目仅供个人学习、研究和技术交流使用，不得用于任何商业目的。
2. **24 小时删除**：请在下载本项目后 **24 小时内** 自行删除所有相关文件。如果你认为本项目对你有帮助，请支持并使用官方正版应用。
3. **禁止商业使用**：严禁将本项目或其衍生作品用于商业用途，包括但不限于销售、分发、盈利等。
4. **版权归属**：798 净水相关的商标、品牌、API 等知识产权均归原公司所有。本项目不持有也不主张对上述内容的任何权利。
5. **免责条款**：使用本项目所产生的任何后果（包括但不限于账号封禁、设备损坏、法律纠纷等）由使用者自行承担，项目作者不承担任何责任。
6. **侵权联系**：如果本项目侵犯了您的合法权益，请通过 Issue 联系我们，我们将在确认后第一时间删除相关内容。

**使用本项目即表示你已阅读并同意以上所有条款。**

---

<p align="center">
  <sub>本项目仅供学习交流，与 798 官方无任何关联。</sub>
</p>
