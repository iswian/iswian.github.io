---
title: "稳健投资组合优化 (Robust Portfolio Optimization)"
published: 2026-07-21
description: "来源：Yin, Perchet & Soup (2021), Quantitative Finance，BNP Paribas Asset Management"
category: "投资组合"
tags: []
---

## 1. A Practical Guide to Robust Portfolio Optimization
**来源**：Yin, Perchet & Soupé (2021), *Quantitative Finance*，BNP Paribas Asset Management
**定位**：**业界实操指南**，最实用的鲁棒组合优化入门

### 核心问题
均值方差优化(MVO)对输入参数极敏感。不确定性在预期收益中是协方差矩阵的**10倍**（Chopra & Ziemba, 1993）。鲁棒优化通过显式建模预期收益的不确定性来解决。

### 关键结论

**不确定性集选择**：
- ✅ **推荐：二次不确定性集（椭球）** — 同时考虑收益水平和方向信息
- ❌ **不推荐：盒子不确定性集** — 过于保守，忽略相关性信息

**不确定性矩阵选择**：
- ✅ **推荐：对角矩阵（仅方差）**
- ❌ **不推荐：全协方差矩阵** — 数据需求太大，容易过拟合

**不确定性水平选择**：
- 应基于资产的**夏普比率**来设定：$$
\delta = \frac{c}{\sqrt{T}} \quad \text{c为常数，T为样本量}
$$
- 高夏普 → 更窄的不确定集（更自信）
- 低夏普 → 更宽的不确定集（更谨慎）

### 实操价值
- 多资产组合管理、智能投顾(robo-advising)均可直接应用
- 与Black-Litterman模型互补

---

## 2. Distributionally Robust Risk Parity
**来源**：Costa & Kwon (2022), *Optimization Methods & Software*

**创新**：将分布鲁棒优化引入风险平价组合

**方法**：
- 不对收益分布做结构性假设，而是通过**模糊集**对观测概率进行鲁棒估计
- 模糊集基于统计距离度量（可选择不同距离：Wasserstein, KL散度等）
- 求解约束凸-凹minimax问题

**算法**：投影梯度上升 + 顺序凸规划 — **高度可扩展**，适合大规模组合

**实验结论**：DR风险平价相比名义风险平价有更高的风险调整后收益

---

## 交叉引用

- 见 [端到端组合构建](端到端组合构建.md) — 端到端方法全景（含DR-E2E/IPO/SPO+等）
- 见 [SVM组合优化](SVM组合优化.md) — SVM+基数约束MVO组合优化
- 见 [GAN策略组合](GAN策略组合.md) — GAN生成策略微调组合
- 见 [Barra纯因子](../因子选股/Barra纯因子.md) — 风险模型基础
- 见 [华泰多因子](../因子选股/华泰多因子.md) — 传统组合优化流程