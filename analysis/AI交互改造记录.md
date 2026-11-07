# AI 交互改造记录

## 输入经验与事实边界

- `analysis/upstream/dsh-image-studio-main/dsh-image-studio-main/README.zh.md` 描述图像插件的核心交接模式：编辑产物明确写入并整理成面向 agent 的消息，再交给会话继续处理；具体实现将消息填入 composer 并尝试提交，无法取得 composer 时显示可手动发送的交接内容。视频编辑仍保留 DSH 原生会话作为唯一对话，不复制另一套聊天存储。
- ComeCut `README_ZH.md`（2026-10-05 里程碑段落）和随包指南把 Agent chat 描述为可辅助找素材、编辑剪辑、调音量、修改/翻译字幕，以及调用 ComfyUI 生成图像/视频；同一 README 声称 ASR→字幕翻译→TTS→合成工作流。给定包缺少编辑器源码，故这些只能作为上游产品能力声明/交互方向，不能证明其实现细节。
- `dsh-media-video` 当前注册的 `media_video_*` 工具支持 read/apply/command-result/export-start/export-status；能力状态中 ASR、字幕翻译、TTS、ComfyUI/Hunyuan 等均未提供。本次未添加虚构的调用或外部服务。

## 改动

1. `lib/client.js`
   - 将初始建议由 3 条扩展至 6 条：工程和选中片段概览、时间线问题检查、字幕草稿（先不写入）、音量修改、字幕/配音工作流规划、竖屏适配方案。
   - 建议点击仍仅写 composer 草稿并聚焦输入；发送仍需用户手动动作。
   - 工具卡片显示中文的编辑工具名、操作名、状态；对轨道/片段回执加上对应 ID 摘要；读状态卡显示轨道/片段/叠加层概要。
   - AI 提示词强化先读当前状态、分析请求只读、高风险授权不绕过、修改后回读、未接入能力明确标注。
   - 修复状态翻译后的成功色判断，保证“已应用”仍显示成功色。
   - 保留原生会话流、原生审批、revision/digest/commandId 安全契约和错误回执，不新增自动修改路径。
2. `test/video-chat.test.mjs`
   - 验证建议覆盖、建议只填草稿、操作/状态中文化及高风险 pending 文案。
3. `README.md`
   - 记录交互边界和当前能力缺口。

## 验收

命令：`node --test test/*.test.mjs`（工作目录 `dsh-media-video`）。结果：7 tests，7 pass，0 fail。首次定向测试因测试期望的 clip ID 截取长度与实现不一致而失败；调整为对实际可见摘要 `clip-123` 的断言后通过。未运行宿主 UI，也未验证真实 DSH 对话流/审批。

## 未实现/未验证

- 没有新增 ASR、翻译、TTS、音频分离、ComfyUI/Hunyuan 视频生成或自动译制功能。
- 没有改变功能批准策略；写入权限仍由当前宿主原生策略和插件风险 gate 决定。
- ComeCut 的实际对话实现未能从给定 ZIP 复原；本次借鉴的是随包文档陈述的 AI chat 场景。
- 真实界面的视觉/交互仍需运行 DSH Web 插件页面确认；本次只做源码与 Node 测试验证。
