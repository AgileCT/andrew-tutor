const curriculum = {
  m1: {
    id: "m1",
    title: "Module 1：ML 基础",
    lessons: [
      { id: "1.1", title: "什么是机器学习？直觉建立" },
      { id: "1.2", title: "监督学习：线性回归" },
      { id: "1.3", title: "梯度下降：让模型自己学" },
      { id: "1.4", title: "分类问题：逻辑回归" },
      { id: "1.5", title: "过拟合与正则化" },
      { id: "1.6", title: "实践：用代码跑一个模型" },
    ],
  },
  m2: {
    id: "m2",
    title: "Module 2：神经网络",
    lessons: [
      { id: "2.1", title: "神经元的直觉" },
      { id: "2.2", title: "前向传播" },
      { id: "2.3", title: "反向传播" },
      { id: "2.4", title: "激活函数的选择" },
      { id: "2.5", title: "深层网络的威力" },
    ],
  },
  m3: {
    id: "m3",
    title: "Module 3：实用 ML 技巧",
    lessons: [
      { id: "3.1", title: "偏差与方差诊断" },
      { id: "3.2", title: "训练/验证/测试集拆分" },
      { id: "3.3", title: "学习曲线怎么看" },
      { id: "3.4", title: "MLOps 基础概念" },
    ],
  },
  m4: {
    id: "m4",
    title: "Module 4：现代 AI",
    lessons: [
      { id: "4.1", title: "大语言模型原理" },
      { id: "4.2", title: "Prompt Engineering" },
      { id: "4.3", title: "AI 系统设计思路" },
      { id: "4.4", title: "AI 安全与责任" },
    ],
  },
};

function getAllLessons() {
  return Object.values(curriculum).flatMap((m) => m.lessons);
}

function getLessonById(id) {
  return getAllLessons().find((l) => l.id === id) || null;
}

function getNextLessonId(id) {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.id === id);
  return idx >= 0 && idx < all.length - 1 ? all[idx + 1].id : null;
}

// Node.js compatibility for tests
if (typeof module !== "undefined") {
  module.exports = { curriculum, getAllLessons, getLessonById, getNextLessonId };
}
