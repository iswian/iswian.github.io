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

### 股票池

8大行业 20只蓝筹股（沪深300成分股）：

| 行业 | 数量 | 代表股票 |
|------|------|---------|
| 金融 | 5 | 招商银行、中国平安、兴业银行、中信证券、宁波银行 |
| 消费 | 4 | 贵州茅台、伊利股份、海天味业、美的集团 |
| 医疗 | 2 | 恒瑞医药、云南白药 |
| 科技 | 3 | 立讯精密、中兴通讯、恒生电子 |
| 先进制造 | 2 | 中国中车、顺丰控股 |
| 周期 | 2 | 宝钢股份、万华化学 |
| 资源 | 1 | 中国神华 |
| 保险 | 1 | 中国人寿 |

### 因子

**Fama-French 5因子**（针对20只股票池用2×3独立排序法自定义构建）：
- SMB（规模因子）、HML（价值因子）、MKT（市场因子）
- RMW（盈利能力因子）、CMA（投资水平因子）

**动量/反转因子**：
- Momentum（12-1个月动量，剔除最近1个月）
- STRev（短期反转，过去1个月收益）
- LTRev（长期反转，过去6-12个月收益）

### 实验参数

- **时间范围**: 2015.01.18 — 2025.06.08
- **滚动窗口**: 观察期 104周，回测期 12周（rolling window）
- **调仓频率**: 每周
- **防前瞻偏差**: 因子数据滞后1周

## 实验结果

> 实验数据与核心结论暂不公开。先让数字在本地冷静一下。

## 未来方向（论文中提出）

- **因子改进**：引入更适配 A 股的高频因子、情感因子等
- **区制感知建模**：结合 regime-switching 模型增强非平稳市场适应能力
- **学习架构优化**：更优的预测层设计以更好匹配 DRO 层
- **动态 δ 调整**：根据市场状态自适应调整模糊集半径

## 交叉引用

- 理论与方法论基础：参见 [端到端组合构建](端到端组合构建.md)（12篇 E2E 论文全景）
- 鲁棒优化细节：参见 [稳健组合优化](稳健组合优化.md)（BNP 实战指南 + DR 风险平价）
- 本项目复现的原始论文：Costa & Iyengar (2023) — 包含在 [端到端组合构建](端到端组合构建.md) 的论文综述中
