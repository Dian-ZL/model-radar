const sources = {
  OpenAI: "https://developers.openai.com/api/docs/models/all",
  Anthropic: "https://www.anthropic.com/news/models",
  "Google DeepMind": "https://ai.google.dev/gemini-api/docs/models",
  Meta: "https://ai.meta.com/resources/models-and-libraries/llama-downloads/",
  DeepSeek: "https://deepseek.com/en/transparency/",
  阿里巴巴: "https://github.com/QwenLM",
  月之暗面: "https://forum.moonshot.ai/c/announcement/5",
  MiniMax: "https://www.minimax.io/",
  "Mistral AI": "https://docs.mistral.ai/models",
  智谱: "https://github.com/zai-org",
  字节跳动: "https://developer.volcengine.com/articles/7610285824933445675",
  腾讯: "https://cloud.tencent.com/product/tclm",
  小米: "https://github.com/XiaomiMiMo",
  美团: "https://github.com/meituan-longcat",
};

const techniques = {
  ...techniqueGuides,
  c4a: {
    title: "C4A / CSA",
    tags: ["KV cache 序列维压缩", "稀疏注意力"],
    overview: "DeepSeek V4 的压缩稀疏注意力（Compressed Sparse Attention）把远程历史压成更少的 KV 条目，再为每个查询挑选相关条目。近邻保留原始粒度。",
    diagram: ["重叠窗口加权压缩", "每个查询选远程 Top-k", "合并原始近邻 KV", "执行注意力"],
    steps: [
      "Compressor：以 4 个 token 为步长，从当前组和前一组做学习式加权池化。稳态下，每 4 个 token 新增一个远程条目。",
      "Indexer：给各查询可见的压缩条目打分，并选择 top-k。",
      "Attention：合并选中的远程条目与近邻滑窗条目，执行注意力。",
    ],
    takeaway: "远程压缩条目数约为原序列长度的 1/4。整模型缓存量还取决于各层的注意力类型、滑窗、索引缓存和物理存储格式。",
    phases: "CSA 是模型的 Attention 设计，prefill 和 decode 都会用到。vLLM 另对 decode 路径做了算子融合与 CUDA 多流并行，以减少 HBM 往返和算子启动开销。",
    formatNotes: "训练标签中的 MXFP4 指后训练的量化感知训练（QAT），覆盖 MoE 专家权重和 CSA 索引器的 QK 路径。推理标签描述公开部署实现的部分缓存与权重格式，具体取决于框架、后端和推理阶段。",
    hardware: "在相同硬件、上下文长度和并发下，比较每序列 KV 字节数、HBM 读量和解码延迟。单独测量索引与稀疏算子的开销。",
    links: [
      ["技术报告 §2.3", "https://arxiv.org/html/2606.19348#S2.SS3"],
      ["技术报告 §5.2.1 · MXFP4 QAT", "https://arxiv.org/html/2606.19348#S5.SS2.SSS1"],
      ["官方实现 · Compressor", "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/inference/model.py#L472"],
      ["官方实现 · Indexer", "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/inference/model.py#L573"],
      ["vLLM 实现与动图", "https://vllm.ai/blog/2026-04-24-deepseek-v4"],
    ],
  },
};

const v4 = {
  company: "DeepSeek", date: "2026-04-24", source: sources.DeepSeek,
  change: "长上下文混合注意力，结合 CSA 与 HCA。",
  algorithms: [
    { group: "Attention", name: "C4A / CSA", detail: "c4a" },
    { group: "Attention", name: "C128A / HCA", detail: "hca" },
    { group: "MLP / FFN", name: "DeepSeekMoE", detail: "moe" },
    { group: "Decode", name: "算子融合与多流并行（vLLM）", detail: "fusion" },
  ],
  trainingFormats: [{
    label: "MXFP4",
    usage: "后训练采用 MXFP4 量化感知训练（QAT），覆盖 MoE 专家权重和 CSA 索引器的 QK 路径。",
    source: "https://arxiv.org/html/2606.19348#S5.SS2.SSS1",
  }],
  inferenceFormats: [
    {
      label: "FP4",
      usage: "vLLM 的部署说明将 FP4 用于 MoE 专家权重。此标签描述权重格式。",
      source: "https://vllm.ai/blog/2026-04-24-deepseek-v4",
    },
    {
      label: "FP8",
      usage: "在 vLLM 公布的实现中，解码阶段的注意力算子对部分 KV 使用按 token 量化的 FP8。",
      source: "https://vllm.ai/blog/2026-04-24-deepseek-v4",
    },
  ],
  bottleneck: "KV cache 容量、HBM 带宽、索引开销",
  evidence: "首 token 延迟（TTFT）、每序列 KV 字节数、HBM 读量、输出 token 间延迟（ITL）",
};

const models = [
  {
    company: "Anthropic", name: "Claude Fable 5.2", date: "2026-11-09",
    source: sources.Anthropic,
    change: "面向编程、科学等复杂任务。",
    algorithms: [],
    bottleneck: "长任务推理资源与服务容量",
    evidence: "每任务 token、完成时间、成功率",
  },
  {
    company: "腾讯", name: "混元 Hy4 preview", date: "2026-08-28", source: sources.腾讯,
    change: "面向长文、编程与 Agent，官方列出 770B 总参数、49B 激活。",
    algorithms: [{ group: "MLP / FFN", name: "MoE", detail: "moe" }],
    bottleneck: "权重容量、跨卡专家通信",
    evidence: "实际部署显存、跨卡通信量、有效吞吐",
  },
  { ...v4, name: "DeepSeek V4 Pro" },
  { ...v4, name: "DeepSeek V4 Flash" },
  {
    company: "字节跳动", name: "豆包 Seed 2.0 Code", date: "2026-02-24",
    source: sources.字节跳动, change: "面向编程任务的专用版本。",
    algorithms: [],
    bottleneck: "多步调用引起的并发推理与缓存压力",
    evidence: "每任务调用次数、等待占比、成功率",
  },
  {
    company: "小米", name: "MiMo-V2-Flash", date: "2025-12-16",
    source: "https://lmsys.org/blog/2025-12-16-mimo-v2-flash/",
    change: "混合注意力与多 token 预测，支持低精度推理。",
    algorithms: [
      { group: "Attention", name: "滑窗与全局注意力", detail: "sliding" },
      { group: "MLP / FFN", name: "MoE", detail: "moe" },
      { group: "Prefill", name: "分块预填充（SGLang）", detail: "chunkedPrefill" },
      { group: "Decode", name: "MTP 推测解码（SGLang）", detail: "mtp" },
    ],
    trainingFormats: [{
      label: "FP8",
      usage: "小米披露该模型的预训练采用 FP8 混合精度。",
      source: "https://github.com/XiaomiMiMo/MiMo-V2-Flash",
    }],
    inferenceFormats: [{
      label: "FP8",
      usage: "小米披露该模型支持 FP8 混合精度推理，并提供 SGLang 部署示例。",
      source: "https://github.com/XiaomiMiMo/MiMo-V2-Flash#6-inference--deployment",
    }],
    bottleneck: "KV cache 带宽、低精度算子效率",
    evidence: "KV 字节数、实际加速比、算子覆盖率",
  },
  {
    company: "Meta", name: "Llama 4 Scout", date: "2025-04-05",
    source: "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
    change: "MoE 架构，官方披露 17B 激活参数。",
    algorithms: [{ group: "MLP / FFN", name: "MoE", detail: "moe" }],
    bottleneck: "权重容量、长序列的缓存压力",
    evidence: "总参数与激活参数、不同长度下的峰值显存",
  },
  ...additionalReleases,
].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

const byId = (id) => document.getElementById(id);
const filters = byId("filters");
const query = byId("query");
const company = byId("company");
const from = byId("from");
const to = byId("to");
const rows = byId("rows");
const algorithmColumns = ["Attention", "MLP / FFN", "Prefill", "Decode"];
const dialog = byId("tech");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function externalLink(label, url) {
  const link = element("a", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function addSection(parent, heading, ...content) {
  const section = element("section");
  section.append(element("h3", heading), ...content);
  parent.append(section);
}

function modelFormats(model) {
  const formats = element("div", "", "formats");
  for (const [stage, entries = []] of [
    ["训练", model.trainingFormats],
    ["推理", model.inferenceFormats],
  ]) {
    const line = element("div", "", "format");
    line.append(element("span", stage, "format-stage"));
    const values = element("div", "", "format-values");
    if (!entries.length) values.append(element("span", "待核验"));
    for (const entry of entries) {
      const tag = element("button", entry.label, "chip");
      tag.type = "button";
      tag.setAttribute("aria-haspopup", "dialog");
      tag.setAttribute("aria-label", model.name + " " + stage + "数据格式 " + entry.label);
      tag.addEventListener("click", () => showFormat(model, stage, entry));
      values.append(tag);
    }
    line.append(values);
    formats.append(line);
  }
  return formats;
}

function showFormat(model, stage, entry) {
  byId("format-title").textContent = entry.label;
  byId("format-model").textContent = model.name + " · " + stage + "数据格式";
  byId("format-usage").textContent = entry.usage;
  byId("format-source").href = entry.source;
  const formatDialog = byId("format-detail");
  formatDialog.showModal();
  formatDialog.scrollTop = 0;
}

function c4aWindows() {
  const figure = element("figure", "", "tech-diagram");
  const lanes = element("div", "", "kv-windows");
  for (let position = 1; position <= 12; position++) {
    lanes.append(element("span", String(position), "kv-token"));
  }
  lanes.append(element("span", "位置 1–8 → 条目 A", "kv-window kv-first"),
    element("span", "位置 5–12 → 条目 B", "kv-window kv-second"));
  figure.append(element("figcaption", "C4A 的重叠窗口"), lanes,
    element("p", "两个窗口重叠 4 个位置。示意图展示稳态窗口，省略了序列开头的边界处理。", "note"));
  return figure;
}

function showTechnique(id, model) {
  const technique = techniques[id];
  byId("tech-title").textContent = technique.title;
  byId("tech-model").textContent = model.name;
  const body = byId("tech-body");
  body.replaceChildren(...technique.tags.map((tag) => element("span", tag, "chip")));

  const steps = element("ol");
  steps.append(...technique.steps.map((step) => element("li", step)));
  const diagram = element("figure", "", "tech-diagram");
  const flow = element("ol", "", "tech-flow");
  flow.append(...technique.diagram.map((step) => element("li", step)));
  diagram.append(element("figcaption", "数据流示意"), flow);
  addSection(body, "站内技术解读", element("p", technique.overview), diagram,
    ...(id === "c4a" ? [c4aWindows()] : []), steps,
    element("p", technique.takeaway, "takeaway"));
  addSection(body, "Prefill 与 Decode", element("p", technique.phases));
  addSection(body, "训练与推理数据格式", modelFormats(model),
    ...(technique.formatNotes ? [element("p", technique.formatNotes, "note")] : []));
  addSection(body, "硬件影响与验证", element("p", technique.hardware));
  const links = element("div", "", "links");
  links.append(...technique.links.map(([label, url]) => externalLink(label, url)));
  addSection(body, "原始来源", links);

  dialog.showModal();
  dialog.scrollTop = 0;
}

function modelAlgorithms(model) {
  return algorithmColumns.map((group, index) => {
    const cell = element("td", "", index % 2 === 0 ? "group-start" : "");
    const entries = (model.algorithms || []).filter((entry) => entry.group === group);
    if (!entries.length) cell.append(element("span", "待核验", "format-pending"));
    for (const entry of entries) {
      if (entry.detail) {
        const button = element("button", entry.name, "chip");
        button.type = "button";
        button.setAttribute("aria-haspopup", "dialog");
        button.addEventListener("click", () => showTechnique(entry.detail, model));
        cell.append(button);
      } else if (entry.source) {
        const link = externalLink(entry.name, entry.source);
        link.className = "chip";
        cell.append(link);
      } else {
        cell.append(element("span", entry.name, "chip"));
      }
    }
    return cell;
  });
}

function profileSpecs(profile) {
  return [
    ["总参数 / 激活参数", profile.total ? profile.total + " / " + (profile.active || "待核验") : "待核验"],
    ["最大上下文", profile.context ? profile.context + " tokens" : "待核验"],
    ["获取方式", profile.access || "待核验"],
  ];
}

function showModel(model, profile) {
  byId("model-title").textContent = model.name;
  byId("model-company").textContent = model.company + (model.date ? " · " + model.date : "");
  const body = byId("model-body");
  body.replaceChildren();
  const specs = element("dl", "", "profile-specs");
  for (const [label, value] of profileSpecs(profile)) {
    specs.append(element("dt", label), element("dd", value));
  }
  const sources = element("p", "", "links");
  sources.append(externalLink("模型卡或官方规格 ↗", profile.source || model.source));
  if (profile.accessSource) sources.append(externalLink("权重与许可证 ↗", profile.accessSource));
  addSection(body, "模型规格", specs, sources);
  for (const [label, entry] of [
    ["部署条件", profile.deployment],
    ["公开性能数据", profile.performance],
    ["能力评测与任务成本", profile.evaluation],
    ["训练披露", profile.training],
  ]) {
    if (!entry) {
      addSection(body, label, element("p", "暂无已核验记录。", "note"));
      continue;
    }
    const [description, source] = entry;
    addSection(body, label, element("p", description),
      externalLink("查看来源 ↗", source || profile.source));
  }
  const modelDialog = byId("model-detail");
  modelDialog.showModal();
  modelDialog.scrollTop = 0;
}

function modelRow(model) {
  const row = element("tr");
  const name = element("th");
  name.scope = "row";
  const profile = modelProfiles[model.name] || { source: model.source, ...model.profile };
  const modelButton = element("button", model.name, "model-name");
  modelButton.type = "button";
  modelButton.setAttribute("aria-haspopup", "dialog");
  modelButton.addEventListener("click", () => showModel(model, profile));
  name.append(modelButton, element("span", model.company, "company"));
  const specCells = profileSpecs(profile).map(([, value], index) =>
    element("td", value, index < 2 ? "numeric-spec" : ""));
  const date = element("td");
  if (model.date) {
    const time = element("time", model.date);
    time.dateTime = model.date;
    const link = externalLink("", model.source);
    link.title = "查看发布来源";
    link.append(time);
    date.append(link);
  } else {
    date.textContent = "待核验";
  }
  const formats = element("td", "", "format-cell group-start");
  formats.append(modelFormats(model));
  row.append(name, date, ...specCells, element("td", model.change), ...modelAlgorithms(model), formats,
    element("td", model.bottleneck || "待核验"), element("td", model.evidence || "待核验"));
  return row;
}

function render() {
  const keyword = query.value.trim().toLowerCase();
  const invalidRange = from.value && to.value && from.value > to.value;
  const visible = invalidRange ? [] : models.filter((model) => {
    const text = [model.name, model.company, ...(model.algorithms || []).map((item) => item.group + " " + item.name)]
      .join(" ").toLowerCase();
    return text.includes(keyword) &&
      (!company.value || model.company === company.value) &&
      (!from.value || (model.date && model.date >= from.value)) &&
      (!to.value || (model.date && model.date <= to.value));
  });
  byId("count").textContent = "显示 " + visible.length + " / " + models.length + " 个版本";
  rows.replaceChildren(...visible.map(modelRow));
  if (!visible.length) {
    const row = element("tr");
    const message = invalidRange ? "结束日期应晚于或等于起始日期。" : "没有符合筛选条件的模型。";
    const cell = element("td", message, "empty");
    cell.colSpan = 9 + algorithmColumns.length;
    row.append(cell);
    rows.append(row);
  }
}

for (const [name, url] of Object.entries(sources)) {
  const option = element("option", name);
  option.value = name;
  company.append(option);
  const item = element("li");
  item.append(externalLink(name, url));
  byId("sources").append(item);
}

filters.addEventListener("input", render);
filters.addEventListener("submit", (event) => event.preventDefault());
filters.addEventListener("reset", () => requestAnimationFrame(render));
render();
