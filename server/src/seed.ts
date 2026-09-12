import db from './db/index.js'

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

const quickLinks = [
  { title: '美团内网', url: 'https://km.sankuai.com', description: '美团知识管理', category: 'work', sort_order: 1 },
  { title: '美团OA', url: 'https://meets.sankuai.com', description: '办公自动化', category: 'work', sort_order: 2 },
  { title: '大象', url: 'https://大象.com', description: '内部沟通', category: 'work', sort_order: 3 },
  { title: '蛋挞', url: 'https://danta.sankuai.com', description: '数据平台', category: 'work', sort_order: 4 },
  { title: 'CRM系统', url: 'https://crm.sankuai.com', description: '客户关系管理', category: 'work', sort_order: 5 },
  { title: 'Google', url: 'https://www.google.com', description: '搜索引擎', category: 'tools', sort_order: 1 },
  { title: 'GitHub', url: 'https://github.com', description: '代码托管', category: 'tools', sort_order: 2 },
  { title: 'Feishu', url: 'https://www.feishu.cn', description: '飞书文档', category: 'tools', sort_order: 3 },
  { title: 'Notion', url: 'https://www.notion.so', description: '笔记管理', category: 'tools', sort_order: 4 },
  { title: '脉脉', url: 'https://maimai.cn', description: '职场社交', category: 'social', sort_order: 1 },
  { title: 'LinkedIn', url: 'https://www.linkedin.com', description: '职业社交', category: 'social', sort_order: 2 },
  { title: '牛客网', url: 'https://www.nowcoder.com', description: '面试刷题', category: 'reference', sort_order: 1 },
  { title: '知乎', url: 'https://www.zhihu.com', description: '问答社区', category: 'reference', sort_order: 2 },
  { title: '36氪', url: 'https://36kr.com', description: '科技资讯', category: 'reference', sort_order: 3 },
]

const interviewQuestions = [
  { company_id: null, question: '请做一个自我介绍', answer: '1分钟版本：姓名+当前公司岗位+核心业绩+求职动机\n3分钟版本：教育背景+工作经历分段讲+核心项目深挖+个人优势总结', category: 'general', difficulty: 'easy' },
  { company_id: null, question: '你为什么从上家公司离职？', answer: '客观原因优先：组织架构调整/业务方向变化。避免抱怨前公司。强调对新机会的期待和匹配度。', category: 'behavioral', difficulty: 'medium' },
  { company_id: null, question: '你的优缺点是什么？', answer: '优点：运营+技术复合能力，能独立从0到1\n缺点：追求完美导致效率有时受影响，正在通过优先级管理改善', category: 'behavioral', difficulty: 'medium' },
  { company_id: null, question: '如何制定一个品类的增长策略？', answer: '四步法：\n1. 诊断：GMV拆解=流量×转化×客单价，找到瓶颈\n2. 策略：针对瓶颈制定供给侧/需求侧/平台侧策略\n3. 协同：拉通产运、商家、BD等各方资源\n4. 复制：跑通模型后横向复制到其他品类/区域', category: 'case', difficulty: 'hard' },
  { company_id: null, question: '你做过的最有成就感的项目是什么？', answer: '良辰吉市跨4业务组协同案例：作为中台角色拉通闪购、到店、配送、广告4个业务组，通过AI工具实现效率提升。突出跨部门协同能力和技术赋能运营。', category: 'behavioral', difficulty: 'medium' },
  { company_id: null, question: '如何用数据驱动运营决策？', answer: '1. 确定北极星指标（如GMV/订单量）\n2. 搭建指标体系（漏斗拆解）\n3. 每日/周盯盘，发现异常\n4. 归因分析（外部环境/内部策略/竞对动作）\n5. 制定策略A/B测试验证\n6. 结论沉淀方法论', category: 'technical', difficulty: 'medium' },
  { company_id: null, question: '面对业绩压力你会怎么做？', answer: '1. 拆解目标到可执行动作\n2. 分优先级推进\n3. 每日复盘进度\n4. 及时暴露风险，拉通资源\n5. 保持心态稳定', category: 'behavioral', difficulty: 'medium' },
  { company_id: null, question: '你对本地生活行业怎么看？', answer: '核心趋势：\n1. 到店与到家融合加速\n2. 内容化驱动交易（短视频+直播）\n3. 商家数字化升级需求旺盛\n4. 下沉市场空间大\n5. 平台从流量分配到深度赋能商家', category: 'case', difficulty: 'hard' },
]

const knowledgeItems = [
  {
    title: '运营方法论四步法',
    content: '## 诊断\n- GMV = 流量 × 转化率 × 客单价\n- 找到核心瓶颈\n- 对标竞品找差距\n\n## 策略\n- 供给侧：商家数量、商品丰富度\n- 需求侧：用户拉新、复购提升\n- 平台侧：流量分配、补贴策略\n\n## 协同\n- 拉通产运、BD、商家\n- 明确各方职责和时间节点\n- 建立周会机制\n\n## 复制\n- 跑通单店/单品类模型\n- 横向复制到其他区域/品类\n- 沉淀SOP文档',
    source: '',
    tags: ['运营', '方法论', '增长'],
    category: 'methodology'
  },
  {
    title: '面试复盘模板',
    content: '## 基本信息\n- 公司：\n- 岗位：\n- 面试时间：\n- 面试官：\n\n## 面试问题记录\n1. \n2. \n3. \n\n## 回答复盘\n- 回答好的点：\n- 回答不好的点：\n- 改进方向：\n\n## 关键洞察\n- 面试官关注什么：\n- 我遗漏了什么：\n\n## 下一步\n- 补充学习的知识点：\n- 需要准备的案例：',
    source: '',
    tags: ['面试', '模板', '复盘'],
    category: 'template'
  },
  {
    title: '闪购KA运营核心指标',
    content: '## 核心指标\n- GMV（月度/周度）\n- 订单量\n- 客单价\n- 动销门店数\n- 核销率\n- 复购率\n\n## 过程指标\n- 曝光量 → 点击率 → 转化率\n- 活动参与率\n- 补贴效率（ROI）\n\n## 健康度指标\n- 门店活跃度\n- 商品丰富度\n- 履约准时率',
    source: '',
    tags: ['闪购', 'KA', '指标'],
    category: 'learning'
  },
]

const tasks = [
  { title: '准备面试自我介绍', description: '准备1分钟和3分钟两个版本', category: 'interview', priority: 'high', due_date: null, status: 'pending' },
  { title: '更新简历', description: '更新最新项目经历和成果数据', category: 'interview', priority: 'high', due_date: null, status: 'pending' },
  { title: '整理面试复盘文档', description: '把过往面试经验整理成结构化文档', category: 'interview', priority: 'medium', due_date: null, status: 'pending' },
  { title: '每日数据盯盘', description: '查看昨日GMV、订单量、动销门店数', category: 'work', priority: 'medium', due_date: null, status: 'pending' },
]

console.log('Seeding database...')

for (const link of quickLinks) {
  db.insert('quick_links', { ...link, icon: '' })
}
console.log(`Inserted ${quickLinks.length} quick links`)

for (const q of interviewQuestions) {
  db.insert('interview_questions', { ...q })
}
console.log(`Inserted ${interviewQuestions.length} interview questions`)

for (const item of knowledgeItems) {
  db.insert('knowledge_items', { ...item, tags: JSON.stringify(item.tags) })
}
console.log(`Inserted ${knowledgeItems.length} knowledge items`)

for (const task of tasks) {
  db.insert('tasks', { ...task, due_date: task.due_date })
}
console.log(`Inserted ${tasks.length} tasks`)

console.log('Seed completed!')
