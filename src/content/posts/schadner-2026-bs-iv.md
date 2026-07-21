---
title: "Schadner(2026) 显式 BS-IV 公式"
published: 2026-07-21
description: "这篇论文把 BS implied volatility 的反解，从'对 volatility 做数值找根'改写成了'逆高斯分布的分位数反演问题'。"
category: "衍生品-期权"
study: derivatives-pricing
tags: []
---

> Schadner, W. (2026), "An Explicit Solution to Black–Scholes Implied Volatility", arXiv:2604.24480v2


这篇论文把 BS implied volatility 的反解，从"对 volatility 做数值找根"改写成了"逆高斯分布的分位数反演问题"。

## 传统做法

已知市场价格 $C$，求 $\sigma$：

$$
C = BS(\sigma) \quad \Rightarrow \quad \text{解 } BS(\sigma) = C
$$

传统方法是直接对 $\sigma$ 做数值迭代：Newton、Brent、"Let's Be Rational" 等。


## 论文做了什么

### 1. 改写 BS call price

先定义标准化变量：

$$
v = \sigma\sqrt{T},\quad k = \ln(K/F),\quad c = C/(DF)
$$

论文发现对于 $k > 0$（OTM call），BS 归一化 call price 可以写成 **逆高斯分布的生存概率**：

$$
c_{BS}(k, v) = 1 - F_{IG}\!\left(\frac{4}{v^2}; \frac{2}{k}, 1\right)
$$

### 2. 反过来

整理得到：

$$
\frac{4}{v^2} = F_{IG}^{-1}\!\left(1 - c; \frac{2}{k}, 1\right)
$$

所以：

$$
\sigma = \frac{2}{\sqrt{T}}\left[F_{IG}^{-1}\!\left(1 - c; \frac{2}{k}, 1\right)\right]^{-1/2}
$$

ATM 特例更简单，直接退化为标准正态：

$$
\sigma(K=F, C) = \frac{2}{\sqrt{T}} \Phi^{-1}\!\left(\frac{1+c}{2}\right)
$$

### 3. 数学本质

期权价格可以解释为布朗运动首次到达某边界（first-passage time）超过 $4/v^2$ 的概率：

$$
c_{BS}(k, v) = \mathbb{P}\!\left(\tau_k > \frac{4}{v^2}\right), \quad \tau_k = \inf\{t > 0: B_t + \frac{k}{2}t = 1\}
$$

即 **implied vol 本质上是逆高斯分布的一个分位数**。

## 关键理解：它消掉了什么迭代

| 传统方法                              | 这篇论文             |
| --------------------------------- | ---------------- |
| 对 $\sigma$ 迭代求根（Newton/Brent/LBR） | 不再对 BS 方程直接迭代    |
| 迭代对象是 volatility 本身               | 迭代被转移到逆高斯分位数的计算中 |

**理论层面**：IV 反解被显式化了，不再需要对 BS 方程做 root-finding。

**实现层面**：$F_{IG}^{-1}$ 本身通常没有初等闭式。如果自己实现，背后可能仍有数值引擎；如果调 SciPy 的 `scipy.stats.invgauss.ppf`，库内部也可能包含数值方法。

所以准确表述是：**它消掉的是"对 BS 价格方程直接找根"的迭代，但计算逆高斯分位数本身可能仍有数值成分。**

## 和工程实现的关系

论文报告显式公式比 Jäckel (2024) 快 3.4 倍（0.305 μs vs 1.038 μs），且两者均达到机器精度。

但在 production 环境中，还有其他方案可供权衡：

- **插值表（lookup table）**：预计算网格，查表+插值，单次可能比任何解析公式都快
- **有理逼近（Chebyshev / Padé）**：对特定参数范围做定制近似，精度可控
- **GPU 批量计算**：对于大规模 surface 计算，吞吐量比单点延迟更重要

论文的 3.4x 提速是相对于**通用高精度求解器**的，不是相对于所有工程优化方案。所以它不一定会全面碾压已高度优化的生产级实现。

## 真正价值

不是"它一定是世界上最快的 IV solver"，而是：

1. **数学突破**：第一次把 BS implied volatility 写成逆高斯 quantile 的显式表达，把 root-finding 问题变成了概率分位数反演问题
2. **揭示结构联系**：BS price 和 inverse Gaussian / first-passage time 之间的桥梁
3. **下游价值**：对可微分建模、surface analytics、批量化 feature construction 有研究价值

## 对当前工作的关联

IV surface 因子计算需要大量 repeated IV solving，如果用上这个公式：
- **Prototyping 方便**：一次性算对，不用调 Newton 参数
- **可微分 pipeline**：分位数函数可求导，适合 gradient-based 优化
- **GPU 友好**：每个点独立计算，无迭代依赖

目前数据已预处理完毕，暂不需要更换 solver，但值得了解这个工具的存在。