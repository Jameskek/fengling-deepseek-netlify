# Fengling TCM DeepSeek Netlify Demo

## 1. 部署方式

把整个文件夹上传到 GitHub，然后连接 Netlify。

或者直接在 Netlify 新建站点后拖拽此文件夹部署。

## 2. 设置环境变量

Netlify 后台：

Site configuration → Environment variables → Add a variable

添加：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

保存后重新部署一次。

## 3. API 说明

前端调用：

```text
/.netlify/functions/chat
```

后端 Netlify Function 再调用：

```text
https://api.deepseek.com/chat/completions
```

默认模型：

```text
deepseek-v4-flash
```

如果要更强推理，可把 `chat.js` 里的模型改为：

```text
deepseek-v4-pro
```

## 4. 安全说明

不要把 DeepSeek API Key 写在 index.html 里。
必须放在 Netlify Environment Variables。
