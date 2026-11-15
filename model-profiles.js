const deepSeekReport = "https://arxiv.org/html/2606.19348";
const mimoCard = "https://github.com/XiaomiMiMo/MiMo-V2-Flash";
const mimoBenchmark = "https://www.lmsys.org/blog/2025-12-16-mimo-v2-flash/";
const scoutCard = "https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct";
const hy4PreviewSpecs = "https://intl.cloud.tencent.com/techpedia/148044?lang=en";

const modelProfiles = {
  "Claude Fable 5.2": {
    context: "1M", access: "托管 API",
    source: "https://platform.claude.com/docs/en/models/overview",
    deployment: ["Claude Platform API，上下文 1M tokens，最大输出 128K tokens。"],
  },
  "混元 Hy4 preview": {
    total: "770B", active: "49B", context: "1M", access: "托管 API · Preview",
    source: hy4PreviewSpecs,
    deployment: ["腾讯云托管 API。厂商列出的最大输入为 960K tokens，最大输出为 64K tokens。"],
  },
  "DeepSeek V4 Pro": {
    total: "1.6T", active: "49B", context: "1M", access: "开放权重 · MIT",
    source: deepSeekReport,
    accessSource: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro",
    deployment: ["vLLM 发布时的实现主要面向 NVIDIA Hopper 和 Blackwell。具体卡数与并行配置取决于部署方案。", "https://vllm.ai/blog/2026-04-24-deepseek-v4"],
    performance: ["作者报告在 1M 上下文下，单 token 推理 FLOPs 约为 V3.2 的 27%，KV cache 约为 V3.2 的 10%。这是技术报告中的相对效率口径。"],
    training: ["作者披露预训练使用约 33T tokens。"],
  },
  "DeepSeek V4 Flash": {
    total: "284B", active: "13B", context: "1M", access: "开放权重 · MIT",
    source: deepSeekReport,
    accessSource: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash",
    deployment: ["vLLM 发布时的实现主要面向 NVIDIA Hopper 和 Blackwell。具体卡数与并行配置取决于部署方案。", "https://vllm.ai/blog/2026-04-24-deepseek-v4"],
    training: ["作者披露预训练使用约 32T tokens。"],
  },
  "豆包 Seed 2.0 Code": {
    access: "火山方舟 API",
    source: "https://developer.volcengine.com/articles/7610285824933445675",
    deployment: ["火山方舟提供托管 API，支持在 TRAE 等编程场景接入。"],
  },
  "MiMo-V2-Flash": {
    total: "309B", active: "15B", context: "256K", access: "开放权重",
    source: mimoCard,
    deployment: ["LMSYS 发布的测试使用 NVIDIA H200、SGLang Spec v2 和 MTP。并行配置为 DP 2、TP 4、EP 8。", mimoBenchmark],
    performance: ["LMSYS 报告在最长 64K 输入、每个 DP rank 批量 16 的设置下，单请求解码速度约为 150 token/s。测试采用 H200 和 SGLang Spec v2，DP 2、TP 4、EP 8，图注给出的 MTP 接受长度为 3.6。输出长度未在该测试图注中列出。", mimoBenchmark],
    evaluation: ["小米公布的后训练模型评测中，SWE-bench Verified 得分为 73.4%。该条暂未收录可配对的每任务 token 数或完成时间。", mimoCard + "#3-evaluation-results"],
    training: ["小米披露预训练使用约 27T tokens，采用 FP8 混合精度，原生训练序列长度为 32K。"],
  },
  "Llama 4 Scout": {
    total: "109B", active: "17B", context: "10M", access: "开放权重 · Llama 4 社区许可",
    source: scoutCard,
    deployment: ["Meta 发布公告称量化版本可装入单张 NVIDIA H100。该说明属于部署示例，具体上下文与并发下的显存需另测。", "https://ai.meta.com/blog/llama-4-multimodal-intelligence/"],
    training: ["Meta 模型卡列出约 40T 训练 tokens，预训练使用 H100 80GB，累计约 500 万 GPU 小时。"],
  },
};
