---
title: "SVM + 基数约束组合优化"
published: 2026-07-21
description: "来源：Islip, Kwon & Kim (2024), European Journal of Operational Research"
category: "投资组合"
study: portfolio-optimization
tags: []
---

**来源**：Islip, Kwon & Kim (2024), *European Journal of Operational Research*

## 核心创新

首次将**支持向量机(SVM)**整合进基数约束均值-方差优化模型中。

## 方法

**联合建模**：同时选择组合权重和分离超平面，优化三者的权衡：
1. 风险调整后收益
2. 超平面间隔（margin）
3. 分类误差

**数学形式**：凸混合整数二次规划(MIQP)，可用标准商用求解器（如Gurobi, CPLEX）求解，无需自定义算法。

## 参数策略

开发了**Big-M参数选择策略**：
- 保证所选组合的风险在最低可能风险的一定倍数以内
- 生成对从业者有信息量的分离超平面

## 实验

在两组数据集上滚动回测：
- 提出的方法在**样本外风险调整收益**上优于纯基数约束MVO
- 超平面提供了额外的投资流程解释性

## 交叉引用

- 见 [端到端组合构建](端到端组合构建.md) — 其他组合优化方法的对比（端到端全集）
- 见 [稳健组合优化](稳健组合优化.md) — 鲁棒组合优化方法对比
- 见 [Barra纯因子](../因子选股/Barra纯因子.md) — 因子风险模型与组合优化的结合