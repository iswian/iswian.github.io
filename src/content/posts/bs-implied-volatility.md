---
title: "Black-Scholes 隐含波动率的显式公式"
published: 2026-07-21
description: "首次给出 Black-Scholes 隐含波动率的显式公式，解决了期权定价中一个 50 年历史的问题。"
category: "衍生品-期权"
tags: []
---

> Source: Schadner, W. (2026), "An Explicit Solution to Black–Scholes Implied Volatility", arXiv:2604.24480v2

## 核心贡献

**首次给出 Black-Scholes 隐含波动率的显式公式**，解决了期权定价中一个 50 年历史的问题。

此前隐含波动率只能通过数值迭代求解（如 Newton-Raphson、Jäckel 的 "Let's be Rational"），本文将其转化为一个**逆高斯分布的分位数函数求值**。

## 主要公式

### 基础符号
- $C$: 欧式看涨期权价格
- $K$: 行权价，$F$: 远期价格
- $c = C/(DF)$: 归一化期权价格
- $k = \log(K/F)$: 远期对数钱值（log-moneyness）
- $v = \sigma\sqrt{T}$: 总隐含波动率
- $D$: 贴现因子，$T$: 到期时间

### 核心公式

对于 $k > 0$（虚值看涨）：

$$\sigma(K, C) = \frac{2}{\sqrt{T}}\left[\mathcal{F}^{-1}_{IG}\left(1-c;\frac{2}{k},1\right)\right]^{-1/2}$$

其中 $\mathcal{F}^{-1}_{IG}(q; \mu, \lambda)$ 是**逆高斯分布的分位数函数**。

对于 $k < 0$ 的情况，通过钱值转换得到：

$$\sigma(K, C) = \frac{2}{\sqrt{T}}\left[\mathcal{F}^{-1}_{IG}\left(\frac{1-c}{m}; \frac{2}{|k|}, 1\right)\right]^{-1/2}, \quad
m = \begin{cases} 1, & K > F \\ K/F, & K < F \end{cases}$$

### 平价情况（$k=0$）

$$\sigma(K=F, C) = \frac{2}{\sqrt{T}}\Phi^{-1}\left(\frac{c+1}{2}\right)$$

## 关键洞察

### 1. 期权价格 = 逆高斯生存概率

对于虚值看涨期权（$k>0$）：

$$c_{BS}(k, v) = 1 - \mathcal{F}_{IG}\left(\frac{4}{v^2}; \frac{2}{k}, 1\right)$$

即**归一化的看涨期权价格等于逆高斯分布的生存概率**。

### 2. 首次到达时间解释

令 $\tau_k = \inf\{t>0: B_t + \frac{k}{2}t = 1\}$ 为漂移 $k/2$ 的布朗运动首次到达水平 1 的时间，则：

$$c_{BS}(k, v) = \mathbb{P}\left(\tau_k > \frac{4}{v^2}\right)$$

即期权价格是**布朗运动在方差时钟到达前未触达边界的概率**。

### 3. 方差空间解释

$$c_{BS}(k, v) = \mathbb{P}(Z_k < v^2), \quad Z_k \sim GIG\left(\frac12, \frac14, k^2\right)$$

隐含波动率是**广义逆高斯分布在期权价格概率水平上的分位数**。

## 数值表现

| 指标 | 显式公式 | Jäckel (2024) |
|------|---------|---------------|
| 平均绝对恢复误差 | $2.24 \times 10^{-16}$ | $2.12 \times 10^{-16}$ |
| 每评估用时 | **0.305$\mu$s** | 1.038$\mu$s |
| 相对速度 | **快约 3.4 倍** | 基准 |

两种方法均达到**机器精度**（双精度浮点数的极限），但显式公式快 3.4 倍。

## 理论和实践意义

1. **理论突破**：Gerhold (2012) 曾证明隐含波动率不是 $D$-finite 的，排除了大多数传统闭式解，但本文通过逆高斯分布分位数绕过了这一限制
2. **实用价值**：逆高斯分位数函数已内置于标准数值计算库（如 SciPy 的 `scipy.stats.invgauss`），可直接调用
3. **概率视角**：隐含波动率不再是求解器的"黑箱输出"，而是**市场期权价格的分布变换**

## 相关论文

- [波动率微笑对冲](波动率微笑对冲.md) — 波动率微笑下的期权定价与静态对冲