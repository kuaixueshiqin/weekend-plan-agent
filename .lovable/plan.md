## 问题

从 GitHub 拉取更新后预览空白，控制台报错：

```
Failed to resolve import "framer-motion" from "src/pages/Index.tsx"
```

项目里多个组件（`Index.tsx`、`HistorySidebar.tsx`、`TabNavigation.tsx`、`LocationPermissionModal.tsx`、`AskXiaoTuan.tsx` 等）都在 `import { motion } from "framer-motion"`，但当前沙盒环境里这个包没装上，Vite 解析失败，于是整个 React 树渲染不出来。

这是依赖缺失，不是代码 bug，所以不需要改任何业务代码。

## 方案

进入 build 模式后执行：

1. 运行 `bun add framer-motion` 把依赖装进 `node_modules` 并写入 `package.json` / lockfile。
2. 等 Vite 自动重启后刷新预览，确认首页正常渲染、底部 tab 切换动画工作正常。
3. 如有需要，再用 `code--read_console_logs` 复查没有其它残留报错。

## 备注

如果以后再从 GitHub 拉更新发现类似 "Failed to resolve import" 报错，通常都是同样原因——新增依赖在远端的 lockfile 里，但本地沙盒还没同步安装。直接补装对应的包即可，不要去改业务代码。
