const curriculum = {
  m1: {
    id: "m1",
    title: "Module 1：ML 基础",
    titleEn: "Module 1: ML Fundamentals",
    lessons: [
      { id: "1.1", title: "什么是机器学习？直觉建立", titleEn: "What is Machine Learning?" },
      { id: "1.2", title: "监督学习：线性回归", titleEn: "Supervised Learning: Linear Regression" },
      { id: "1.3", title: "梯度下降：让模型自己学", titleEn: "Gradient Descent: How Models Learn" },
      { id: "1.4", title: "分类问题：逻辑回归", titleEn: "Classification: Logistic Regression" },
      { id: "1.5", title: "过拟合与正则化", titleEn: "Overfitting & Regularization" },
      { id: "1.6", title: "实践：用代码跑一个模型", titleEn: "Hands-on: Run Your First Model" },
    ],
  },
  m2: {
    id: "m2",
    title: "Module 2：神经网络",
    titleEn: "Module 2: Neural Networks",
    lessons: [
      { id: "2.1", title: "神经元的直觉", titleEn: "The Intuition Behind Neurons" },
      { id: "2.2", title: "前向传播", titleEn: "Forward Propagation" },
      { id: "2.3", title: "反向传播", titleEn: "Backpropagation" },
      { id: "2.4", title: "激活函数的选择", titleEn: "Choosing Activation Functions" },
      { id: "2.5", title: "深层网络的威力", titleEn: "The Power of Deep Networks" },
    ],
  },
  m3: {
    id: "m3",
    title: "Module 3：实用 ML 技巧",
    titleEn: "Module 3: Practical ML",
    lessons: [
      { id: "3.1", title: "偏差与方差诊断", titleEn: "Diagnosing Bias & Variance" },
      { id: "3.2", title: "训练/验证/测试集拆分", titleEn: "Train / Dev / Test Split" },
      { id: "3.3", title: "学习曲线怎么看", titleEn: "Reading Learning Curves" },
      { id: "3.4", title: "MLOps 基础概念", titleEn: "MLOps Fundamentals" },
    ],
  },
  m4: {
    id: "m4",
    title: "Module 4：现代 AI",
    titleEn: "Module 4: Modern AI",
    lessons: [
      { id: "4.1", title: "大语言模型原理", titleEn: "How Large Language Models Work" },
      { id: "4.2", title: "Prompt Engineering", titleEn: "Prompt Engineering" },
      { id: "4.3", title: "AI 系统设计思路", titleEn: "AI System Design" },
      { id: "4.4", title: "AI 安全与责任", titleEn: "AI Safety & Responsibility" },
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

function lessonTitle(lesson, lang) {
  return lang === "en" ? (lesson.titleEn || lesson.title) : lesson.title;
}

function moduleTitle(mod, lang) {
  return lang === "en" ? (mod.titleEn || mod.title) : mod.title;
}

if (typeof module !== "undefined") {
  module.exports = { curriculum, getAllLessons, getLessonById, getNextLessonId, lessonTitle, moduleTitle };
}
