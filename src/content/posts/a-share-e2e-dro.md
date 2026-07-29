---
title: "A股 E2E DRO 投资组合"
published: 2026-07-21
description: "将 Costa & Iyengar (2023) 的 端到端分布鲁棒组合优化 (E2E DRO) 框架复现到 A 股市场，验证其在政策驱动、非平稳特征明显的中国市场中的有效性。"
category: "投资组合"
study: portfolio-optimization
tags: []
---

## 项目概述

将 Costa & Iyengar (2023) 的 **端到端分布鲁棒组合优化 (E2E DRO)** 框架复现到 A 股市场，验证其在政策驱动、非平稳特征明显的中国市场中的有效性。

核心问题：**E2E DRO 在 A 股能否超越传统的 "先预测再优化" (PTO) 方法？**

## 方法论框架

### 整体流程

```
特征矩阵 x → 预测层 gθ → 预测收益 ŷ + 预测误差 ϵ → 决策层(鲁棒优化) → 权重 z → 任务损失(l)
                                                          ↑
                                                   模糊集 P(δ)
```

与 PTO 的关键区别在于：**预测误差 ϵ 被显式传入决策层**，使得优化器能感知预测的不确定性，并在最差分布下做决策。

### 预测层

两种架构：

| 架构 | 公式 | 损失函数 | DRO 距离度量 |
|------|------|----------|-------------|
| **线性模型** | $g_θ(x) = Wx + b$ | Sharpe Ratio Loss（多期窗口） | Total Variation |
| **两层神经网络** | $g_θ(x) = W_2σ(W_1x + b_1) + b_2$ | Single-Period Return Loss | Hellinger Distance |

### 决策层

目标函数：

$$z^*_t = \arg\min_{z \in Z} \max_{p \in P(\delta)} f_{\epsilon}(z, p) - \gamma \cdot \hat{y}^{\top}_t z$$

- $Z = \{z \ge 0, 1^{\top} z = 1\}$ — 做多+满仓约束
- $f_{\epsilon}(z, p)$ — 基于预测误差的 CVaR 风险度量（pinball loss）
- $P(\delta)$ — ϕ-divergence 模糊集（TV / Hellinger）
- $\gamma$ — 风险偏好参数（端到端学习）
- $\delta$ — 鲁棒性半径（端到端学习）

### 梯度传播

三个参数集联合学习：

$$\frac{\partial l_{task}}{\partial \theta} = \frac{\partial l}{\partial z^*} \cdot \frac{\partial z^*}{\partial \hat{y}} \cdot \frac{\partial \hat{y}}{\partial \theta} + \frac{\partial l}{\partial z^*} \cdot \frac{\partial z^*}{\partial \epsilon} \cdot \frac{\partial \epsilon}{\partial \theta}$$

$$\frac{\partial l_{task}}{\partial \gamma} = \frac{\partial l}{\partial z^*} \cdot \frac{\partial z^*}{\partial \gamma}$$

$$\frac{\partial l_{task}}{\partial \delta} = \frac{\partial l}{\partial z^*} \cdot \frac{\partial z^*}{\partial \delta}$$

通过 CvxpyLayer 实现可微优化层，自动微分计算梯度。

## 数据与因子

实验以具有代表性的 A 股大盘样本为研究对象，覆盖多个主要行业；特征围绕市场、规模、价值、盈利能力、投资水平，以及动量与反转等经典因子族构建。

为避免文章变成可直接照抄的策略说明书，具体股票池、数据接口、因子构造窗口、滚动回测参数与调仓规则不公开。实验过程遵循滚动验证与防前瞻偏差原则。

## 实验结果

> 结果图可以公开，但完整数值表、参数搜索过程与最终策略组合不公开。图片整理好后再端上来，数字先在本地冷静一下。

## 学习笔记与思考

- 端到端学习的价值不只在于提高预测精度，更在于让预测目标真正服务于下游决策。
- 鲁棒性不是简单地“更保守”，而是在分布发生偏移时，为决策留下可控的缓冲。
- 在非平稳市场中，平均表现之外，模型跨区制的稳定性同样值得观察。
- 研究文章应该解释问题、框架与证据，但不必公开所有能直接复制生产策略的资产。

## 未来方向（论文中提出）

- **因子改进**：引入更适配 A 股的高频因子、情感因子等
- **区制感知建模**：结合 regime-switching 模型增强非平稳市场适应能力
- **学习架构优化**：更优的预测层设计以更好匹配 DRO 层
- **动态 δ 调整**：根据市场状态自适应调整模糊集半径

## 交叉引用

- 理论与方法论基础：参见 [端到端组合构建](端到端组合构建.md)（12篇 E2E 论文全景）
- 鲁棒优化细节：参见 [稳健组合优化](稳健组合优化.md)（BNP 实战指南 + DR 风险平价）
- 本项目复现的原始论文：Costa & Iyengar (2023) — 包含在 [端到端组合构建](端到端组合构建.md) 的论文综述中
