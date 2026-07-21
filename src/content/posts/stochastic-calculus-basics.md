---
title: "金融随机分析 (Stochastic Calculus for Finance)"
published: 2026-07-21
description: "定位：衍生品定价的数学基础，与 BS隐含波动率公式、波动率微笑对冲 等互补"
category: "衍生品-期权"
tags: []
---

> **来源**：Peng Jin，讲义，涵盖现代概率基础、信息与条件、Itô积分三大章
> **标签**：#随机分析 #Itô积分 #鞅 #布朗运动 #金融数学

**定位**：衍生品定价的数学基础，与 [BS隐含波动率公式](BS隐含波动率公式.md)、[波动率微笑对冲](波动率微笑对冲.md) 等互补

## 第1章：现代概率基础

### 概率空间
- **$\Omega$（样本空间）**：所有可能结果的集合
- **$\mathcal{F}$（$\sigma$-代数）**：随机事件的集合，满足对补集、可数并、全集封闭
  - 例：若 $A,B \in \mathcal{F}$，则 $A^c, A\cup B, A\cap B \in \mathcal{F}$
  - 可数无穷个事件的并集仍在 $\mathcal{F}$ 中
- **$P$（概率测度）**：从 $\mathcal{F}$ 到 $[0,1]$ 的函数，满足可数可加性

### 随机变量
- **定义**：可测函数 $X: \Omega \to \mathbb{R}$
  - 可测性：$\{\omega: X(\omega) \leq a\} \in \mathcal{F}, \forall a \in \mathbb{R}$
- **分布函数**：$F_X(x) = P(X \leq x)$
- **密度函数**：$f_X(x) = F'_X(x)$（在可微点）
- **类型**：
  - 离散型（二项、泊松等）
  - 连续型（正态、均匀、指数等）

### 期望
- **定义**：$\mathbb{E}[X] = \int_\Omega X(\omega) dP(\omega)$
- **矩**：$\mathbb{E}[X^k]$（$k$阶矩），$\mathbb{E}[(X - \mu)^k]$（$k$阶中心矩）
- **方差**：$\text{Var}(X) = \mathbb{E}[(X - \mu)^2]$
- **不等式**：
  - Markov：$P(|X| \geq a) \leq \mathbb{E}[|X|]/a$
  - Chebyshev：$P(|X - \mu| \geq a) \leq \text{Var}(X)/a^2$
  - Jensen：凸函数 $\phi$，则 $\phi(\mathbb{E}[X]) \leq \mathbb{E}[\phi(X)]$

### 收敛性
- **几乎必然收敛**：$P(\lim_{n\to\infty} X_n = X) = 1$
- **$L^p$收敛**：$\mathbb{E}[|X_n - X|^p] \to 0$
- **依概率收敛**：$P(|X_n - X| > \epsilon) \to 0$
- **依分布收敛**：$F_{X_n}(x) \to F_X(x)$ 在连续点
- **关系**：几乎必然 $\Rightarrow$ 依概率 $\Rightarrow$ 依分布；$L^p \Rightarrow$ 依概率

### 独立性
- $X$ 和 $Y$ 独立 $\iff$ $\mathbb{E}[f(X)g(Y)] = \mathbb{E}[f(X)]\mathbb{E}[g(Y)], \forall f,g$
- 独立 $\Rightarrow$ 不相关，但反之不一定（仅正态分布成立）
- i.i.d.（独立同分布）——金融建模的核心假设之一

## 第2章：信息与条件

### $\sigma$-代数与信息
- **$\sigma$-代数 $\mathcal{F}$** 表示在某一时刻已知的信息集
- **生成子 $\sigma(X)$**：随机变量 $X$ 生成的 $\sigma$-代数，包含所有由 $X$ 可回答的问题
- **信息流（Filtration）**：$\mathcal{F}_0 \subset \mathcal{F}_1 \subset \cdots \subset \mathcal{F}$ 表示信息随时间积累

### Radon-Nikodym定理
- 若 $Q \ll P$（即在 $P$-零测集上 $Q$ 也为零），则存在可测函数 $\frac{dQ}{dP}$ 使得：
  $$Q(A) = \int_A \frac{dQ}{dP} dP, \quad \forall A \in \mathcal{F}$$
- **应用**：测度变换（如风险中性定价中的 Radon-Nikodym 导数）= 金融定价的核心

### 条件期望
- **定义**：$\mathbb{E}[X|\mathcal{G}]$ 是 $\mathcal{G}$-可测的随机变量，且满足：
  $$\int_A \mathbb{E}[X|\mathcal{G}] dP = \int_A X dP, \quad \forall A \in \mathcal{G}$$
- **关键性质**：
  - 修匀性（Tower Property）：$\mathbb{E}[\mathbb{E}[X|\mathcal{G}]|\mathcal{H}] = \mathbb{E}[X|\mathcal{H}]$（若 $\mathcal{H} \subset \mathcal{G}$）
  - 抽出已知量：$\mathbb{E}[ZX|\mathcal{G}] = Z\mathbb{E}[X|\mathcal{G}]$（若 $Z$ 是 $\mathcal{G}$-可测）
  - 条件Jensen不等式

### 鞅 (Martingale)
- **定义**：适应过程 $M_t$，满足 $\mathbb{E}[M_s|\mathcal{F}_t] = M_t, \forall s > t$
- **直观**：对未来的最佳预测就是当前值——**公平游戏**
- **性质**：$\mathbb{E}[M_t]$ 为常数
- **类型**：鞅（等号）、上鞅（$\leq$）、下鞅（$\geq$）
- **应用**：贴现资产价格在风险中性测度下为鞅

## 第3章：Itô积分

### 布朗运动 (Brownian Motion)
- **定义**：连续时间随机过程 $W_t$ 满足：
  1. $W_0 = 0$ a.s.
  2. 独立增量：$W_t - W_s$ 独立于 $\mathcal{F}_s$
  3. 正态增量：$W_t - W_s \sim \mathcal{N}(0, t-s)$
  4. 连续路径：$t \mapsto W_t$ 几乎必然连续
- **性质**：几乎处处不可微、二次变差 $[W, W]_t = t$

### Itô积分构造
- **思路**：对简单过程 $f_t = \sum f_{t_i}\mathbf{1}_{[t_i, t_{i+1})}$ 定义
  $$\int_0^T f_t dW_t = \sum f_{t_i}(W_{t_{i+1}} - W_{t_i})$$
- **$L^2$扩展**：对 $\mathbb{E}[\int_0^T f_t^2 dt] < \infty$ 的过程，通过极限定义
- **不依赖未来**：$f_t$ 需要是 $\mathcal{F}_t$-适应的

### 关键性质
- **鞅性**：$\mathbb{E}[\int_0^T f_t dW_t] = 0$
- **Itô等距**：$\mathbb{E}[(\int_0^T f_t dW_t)^2] = \mathbb{E}[\int_0^T f_t^2 dt]$
- **二次变差**：$[\int f dW, \int g dW]_T = \int_0^T f_t g_t dt$

### Itô公式（一维）
若 $X_t = \mu_t dt + \sigma_t dW_t$，则对 $C^2$ 函数 $f$：
$$df(X_t) = \left(\frac{\partial f}{\partial t} + \mu_t \frac{\partial f}{\partial x} + \frac{1}{2}\sigma_t^2 \frac{\partial^2 f}{\partial x^2}\right)dt + \sigma_t \frac{\partial f}{\partial x} dW_t$$

### Itô公式（多维）
对 $d$ 维 Itô过程 $dX_t^i = \mu_t^i dt + \sum_{j=1}^m \sigma_t^{ij} dW_t^j$：
$$df(t, X_t) = \frac{\partial f}{\partial t} dt + \sum_i \frac{\partial f}{\partial x_i} dX_t^i + \frac{1}{2}\sum_{i,j} \frac{\partial^2 f}{\partial x_i \partial x_j} d[X^i, X^j]_t$$

### 经典应用
- **几何布朗运动**：$dS_t = \mu S_t dt + \sigma S_t dW_t$
  - Itô公式 $\Rightarrow S_t = S_0 \exp\left((\mu - \frac{\sigma^2}{2})t + \sigma W_t\right)$
- **Black-Scholes PDE**的核心推导工具

---

## 交叉引用

- 见 [BS隐含波动率公式](BS隐含波动率公式.md) — Itô公式在期权定价中的应用
- 见 [波动率微笑对冲](波动率微笑对冲.md) — 随机分析在奇异期权对冲中的应用
- 见 [IV曲面构建](IV曲面构建.md) — 隐含波动率曲面的非参数估计