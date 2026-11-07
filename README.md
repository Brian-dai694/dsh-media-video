# dsh-media-video

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)

Current package version: `0.2.6`.

DSH Host plugin: shared video editing tools plus the packaged video editor page.

独立包：只注册视频入口（`dsh-media-video`），路由前缀 `/media-video`，
工具表只含 `media_video_*`。与另一个编辑器包互不依赖，可单独安装。

## AI 剪辑协作

- 对话建议覆盖工程/选中片段概览、时间线诊断、字幕草稿、轨道音量、译制工作流规划和竖屏适配方案；点击建议只填入输入框，不会自动发送。
- AI 上下文要求先读当前工程；用户只要分析时不写入；实际改动遵循 media_video 工具 schema、高风险授权和微秒时间单位，并在修改后回读核验。
- 工具卡片将轨道/片段操作与运行状态显示为中文。当前没有接入 ASR、翻译、TTS 或视频生成工具；AI 应把这些说成规划/外部工作流，不得声称已经执行。
- 交互参考 `dsh-image-studio` 的对话交接闭环，以及 ComeCut README 所描述的剪辑助手场景；ComeCut 给定 ZIP 是文档/构建资源包，本插件未复制或宣称实现其 ASR/TTS 能力。

## 时间线操作

- 轨道时间线支持横向滚动、鼠标定位播放头、缩放、片段拖动与磁吸。`Ctrl/Command + 滚轮` 围绕指针位置缩放；`←/→` 每次移动 0.1 秒，`Shift + ←/→` 每次移动 1 秒。
- 片段拖动默认吸附到 0.25 秒网格、其它片段边缘和当前播放头；“吸附开”可关闭。pointermove 只预览位置，pointerup 才提交一个撤销单元；取消拖动恢复原位。
- 预览画面随播放头所在视频片段更新，片段间可连续播放；播放头处于空档时停止并显示空画面。导出期间编辑与撤销/重做均锁定。
- 时间刻度和拖动几何由 `public/video/timeline-geometry.mjs` 统一计算；时间轴编辑仍使用工程 reducer，AI 工具继续使用整数微秒与原审批契约。

## 测试

```bash
node --test test/*.test.mjs
```

## 开发须知

- 改样式/脚本后验证前先关缓存：CDP 里先调 `Network.setCacheDisabled({ cacheDisabled: true })` 再导航。否则浏览器会复用旧的 `video.css` / `video.js`，改了看起来“没生效”，很容易把缓存问题误判成层级或逻辑 bug（本项目已经踩过一次）。
- 导出必须在前台标签页：后台标签的 requestAnimationFrame 被节流，合成循环不推进。
- 导出链路不要碰 `element.muted` / `element.volume`：`createMediaElementSource` 会把预览状态带进成片，音量只走 GainNode。
- 同一 `sourceRef` 只允许一处发声（`DUPLICATE_AUDIO_SOURCE`）：一个媒体元素只能接一条音频链。
