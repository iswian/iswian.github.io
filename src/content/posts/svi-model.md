---
title: "SVI波动率微笑参数化模型"
published: 2026-07-21
description: "SVI（Stochastic Volatility Inspired）由 Gatheral 提出，是目前最流行的隐含波动率微笑参数化方法之一。"
category: "衍生品-期权"
tags: []
---

SVI（Stochastic Volatility Inspired）由 Gatheral 提出，是目前最流行的隐含波动率微笑参数化方法之一。

## SVI参数公式

$$w(k)=a+b[\rho(k-m)+\sqrt{(k-m)^2+\sigma^2}]$$

其中 $k$ 为在值程度（log-moneyness），$w(k)$ 为隐含方差（implied variance）。

## 参数含义

| 参数 | 含义 | 取值参考 |
|-----|------|---------|
| $a$ | 整体水平（level） | 控制微笑的上下平移 |
| $b$ | 两边斜率（slope） | $b > 0$，控制翼部陡峭度 |
| $\rho$ | 偏斜度（skew） | $|\rho| < 1$，左右不对称 |
| $m$ | 平移 | 微笑最低点的水平位置 |
| $\sigma$ | 曲率 | $\sigma > 0$，控制微笑底部曲率 |

## 优点
- 形式简单，易于拟合市场数据
- 符合Lee(2004)的极端虚实值渐近线性质——可作为外插值公式
- 长剩余期限下，与Heston模型产生一致的波动率微笑形状（Gatheral & Jacquier, 2011）
- 计算复杂度远小于随机波动率模型

## 缺点
- 原始SVI无法给出简单可操作的无套利约束条件
- 拟合结果可能存在日历套利或蝶式套利

## 改进：SSVI（Surface SVI）
Gatheral & Jacquier (2014) 提出SSVI，对SVI进行无套利约束改进，可直接构建完整的隐含波动率曲面。

## 应用场景
- 隐含波动率曲面的平滑和插值
- 作为场外期权和缺乏流动性期权的定价参考
- 波动率曲面信息的压缩和因子化（SVI参数本身可作为特征使用）

---

**相关页面**：[BS隐含波动率公式](BS隐含波动率公式.md)、[波动率微笑对冲](波动率微笑对冲.md)、[商品期权IV预测](商品期权IV预测.md)