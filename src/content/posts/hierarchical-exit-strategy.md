---
title: "分层次出场策略框架"
published: 2026-07-21
description: "不要一上来就让 ML 直接学'什么时候平仓'这个问题太复杂、太容易过拟合。更稳的做法是分三层，逐层递进："
category: "择时"
tags: []
---

> 把决策层级切分，让每个模型只回答一个简单问题，避免端到端学习带来的过拟合。

## 核心理念

**不要一上来就让 ML 直接学"什么时候平仓"**——这个问题太复杂、太容易过拟合。更稳的做法是分三层，逐层递进：

```
Level 1: entry 模型           → 是否开仓 + 方向
Level 2: best_horizon 模型    → 这笔交易持多久最合适
Level 3: continue/exit 模型   → 持仓过程中每bar判断是否提前退场
```

---

## Level 1：Entry 模型

已有策略负责的部分。输入当前特征，输出是否开仓、什么方向。

当前已有方案：
- IV + percentile + reverse signal
- 信号强度阈值过滤
- 方向性条件（如 low_band < close < high_band 看涨，close > high_band 看跌）

---

## Level 2：Best Horizon 模型（优先做）

### 目标

不再问"现在该不该平"，而是问**"这笔交易持多少个bar最合适"**。

### 标签构造

```python
# 开仓后，计算未来多个bar的累计收益
ret_3  = future_return_over_N_bars(3)   # 约15分钟
ret_6  = future_return_over_N_bars(6)   # 约30分钟
ret_12 = future_return_over_N_bars(12)  # 约1小时
ret_24 = future_return_over_N_bars(24)  # 约2小时

best_horizon = argmax([ret_3, ret_6, ret_12, ret_24])
# 输出: 0, 1, 2, 3 分别对应短/中/较长/长
```

### 特征（开仓时刻的可用信息）

- 当前 IV percentile
- IV 变化率（过去 N bar）
- 信号类型（long/short）及当前信号强度
- 当前 bar 的形态（高低开收、成交量）
- ATR（归一化过）
- 时间特征（一天中的第几根bar）
- 入场前的波动特征（过去 N bar 的 range/volatility）

### 模型选型

**多分类模型**（4个类别），推荐 XGBoost / LightGBM：
- 样本量充足（每次开仓是一个样本）
- 不易过拟合（问题比"每bar判断平不平"稳定得多）
- 可输出类别概率，便于风控

### 回测修改方法

```python
# 开仓时
predicted_horizon = best_horizon_model.predict(features)

# 持仓过程中
if bars_held >= predicted_horizon:
    exit_position()
# 期间只保留硬止损（如 ATR × 2），不再用 SignalChange 平仓
```

这将直接验证核心问题：**吃不到收益是不是因为出场太早/太乱**。

---

## Level 3：Continue/Exit 模型

### 目标

持仓过程中，每根 bar 动态判断：**继续持有的期望收益是否 > 平仓**？

### 标签构造

```python
# 如果继续持有 N bar，收益是否仍然为正
continue_label = future_trade_return_next_3_bars > 0
```

### 特征（持仓中的动态信息）

- 当前浮盈浮亏（绝对值、百分比）
- 持仓时间（已持 bar 数 / 预测 horizon）
- 入场以来最大有利波动 MAE/MFE（最大浮盈/最大浮亏）
- 当前 IV 因子（及变化率）
- 当前 pred_prob（原 entry 模型的置信度）
- ATR 变化
- 是否出现信号反转

### 模型选型

**二分类**（继续 / 平仓），XGBoost 或简单逻辑回归：
- 预测继续持仓价值低 → 提前平仓
- 本质是 meta-labeling 思路：主模型决定 entry，副模型决定 exit

---

## 三、更推荐的做法：Meta-labeling Exit

**不要用 RL**（样本太少，容易学成回测记忆大师）。

当前最推荐的做法：

```
主模型（已有）：负责 entry
  └─ 是否开仓、方向是什么

次模型（新增）：只回答
  └─ 这笔 entry 值不值得持有？
  └─ 需不需要过滤？
  └─ 持多久？
```

这比让一个模型同时决定开仓和平仓稳定得多。

### 三步实施路线

| 步骤 | 内容 | 验证目标 |
|------|------|---------|
| **Step 1** | 构造 best_horizon 标签数据，训练 Level 2 分类模型 | 判断出场周期是否可预测 |
| **Step 2** | 修改回测：开仓后按预测 horizon 持有，仅硬止损 | 验证吃不到收益是否因出场太乱 |
| **Step 3** | 若 Step 2 有效，叠加 Level 3 continue/exit 模型 | 优化动态出场，提升收益质量 |

---

## 与现有框架的关系

当前已有"三层交易信号"（信号层→执行层→绩效层），本框架是新引入的**出场策略的分层次 ML 框架**，二者可以结合：

- 信号层 → 产生 entry 信号
- **最佳持仓周期层（本框架 Level 2）** → 决定持仓时长
- **动态出场层（本框架 Level 3）** → 持仓中微调出场时机
- 执行层 → 执行买卖指令
- 绩效层 → 回测评估
