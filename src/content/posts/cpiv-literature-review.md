---
title: "CPIV 相关文献综述"
published: 2026-07-21
description: "不再单纯证明 CPIV 有效，而是研究 IV spread 预测未来收益背后的跳跃风险和美式期权提前执行溢价"
category: "衍生品-期权"
study: derivatives-pricing
tags: []
---

> 来源：Obsidian 笔记 `期货/111.md` 中的文献推荐整理
> 核心线索：Call-Put Implied Volatility Spread (CPIV) 及其邻近方向研究

## CPIV 核心机制解释类

### 1. Early Exercise, Implied Volatility Spread and Future Stock Return: Jumps Bind Them All (2023/2024)

- **SSRN**: [链接](https://ssrn.com/abstract=4436748)
- 不再单纯证明 CPIV 有效，而是研究 IV spread 预测未来收益背后的**跳跃风险**和**美式期权提前执行溢价**
- 适合回答"这个信号到底在抓什么"

### 2. Why Does Options Market Information Predict Stock Returns? (2018/2023 revised)

- **SSRN**: [链接](https://ssrn.com/abstract=2851560)
- 解释机制：不少 IV spread 类信号与 **stock borrow fee / 做空约束** 有关
- 适合不想只做"发现因子"而想搞清"因子为什么有效"的研究

## 高阶矩与信号扩展类

### 3. Risk-Neutral Higher Moments and the Cross-Section of Stock Returns (2024)

- **SSRN**: [链接](https://ssrn.com/abstract=4777204)
- 从单一 IV spread 扩展到风险中性高阶矩：implied volatility、skewness、kurtosis
- 说明 option-implied 的二、三、四阶信息都可能带收益预测力

### 4. Cross-sectional Variation of Option Implied Volatility Skew (2020/2022 revised)

- **SSRN**: [链接](https://ssrn.com/abstract=3707006)
- 研究 implied skew 的横截面变化：哪些是结构性风险，哪些是短期信息流
- 适合借鉴"把期权信号拆成长期结构部分和短期信息部分"的方法

## VRP 与 realized-implied spread 类

### 5. Stock Return Predictability of Realized-Implied Volatility Spread and Abnormal Turnover (2025)

- **SSRN**: [链接](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5234112)
- 不再用 call-put IV spread，而是 **realized-implied volatility spread**
- 研究该 spread 对未来收益的预测力受异常换手率的影响

## 期权收益类

### 6. Asymmetry and the Cross-Section of Option Returns (2024)

- **SSRN**: [链接](https://ssrn.com/abstract=4626444)
- 利用分布不对称性（asymmetry），与 implied skew、spread 思想接近
- 适合从"标的收益预测"扩展到"期权自身收益预测"

---

## 按研究方向推荐阅读顺序

1. **机制解释**：Jumps Bind Them All → Why Does Options Market Information Predict
2. **信号扩展**：Risk-Neutral Higher Moments → Cross-sectional Variation of Skew
3. **VRP 方向**：Realized-Implied Volatility Spread
4. **期权收益**：Asymmetry and Option Returns

> 💡 如果做期货 IV 三参数（Level / Variation / Skew）研究，上述 1–4 分别对应了机制解释、Variation/Skew 方法、Level 替代指标等维度。