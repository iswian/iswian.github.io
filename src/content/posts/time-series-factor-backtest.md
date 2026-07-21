---
title: "时序因子回测"
published: 2026-07-21
description: "与多因子选股横截面分组不同，时序因子回测针对单个品种，按信号值的时间序列分位数分组，构建多空组合。"
category: "量化实操"
study: asset-allocation
tags: []
---

> 单品种期货按信号分位数分层回测方法，滚动分位数分组与绩效评估

## 核心思路

与多因子选股横截面分组不同，**时序因子回测**针对**单个品种**，按**信号值的时间序列分位数**分组，构建多空组合。

### 基本流程

```
信号值 → 滚动分位数 → 分组标签 → 组内等权 → 组间绩效 → 多空组合
```

## 分组方法

### 1. 固定阈值分组

| 组别 | 阈值 | 含义 |
|------|------|------|
| 组1（多头） | 信号 > 70%分位数 | 强信号 |
| 组2（中性） | 30%~70%分位数 | 弱信号/无信号 |
| 组3（空头） | 信号 < 30%分位数 | 负信号 |

**缺点**：市场结构变化会导致各组样本量不均

### 2. 滚动分位数分组（推荐）

使用**滚动窗口**计算分位数阈值，适应非平稳市场：

```python
def rolling_quantile_groups(signal, window=252, n_groups=5):
    """
    滚动分位数分组
    - signal: 时间序列信号
    - window: 滚动窗口
    - n_groups: 分组数 (默认5组)
    """
    quantiles = signal.rolling(window).quantile(
        [i/n_groups for i in range(1, n_groups)]
    )
    # 每组等量 -> 按滚动分位数分配标签
    groups = pd.DataFrame(index=signal.index)
    for i in range(n_groups):
        lower = quantiles.iloc[:, i-1] if i > 0 else -np.inf
        upper = quantiles.iloc[:, i]
        groups[f'G{i+1}'] = (signal >= lower) & (signal < upper)
    return groups
```

#### 参数选择

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 滚动窗口 | 252天（1年） | 足够长来稳定分位数，又足够短适应市场变化 |
| 分组数 | 3~5 | 3组（多/中/空）或 5组（分层更细） |
| 最小样本 | 观察期≥60天 | 信号进入回测前需要预热期 |

## 绩效评估

### 组内收益计算

```
组收益_t = mean(品种收益_t × 信号组标签_{t-1})
```

- 用 **t-1 信号** 预测 **t 收益**
- 组内等权（时间序列上所有信号点均值）

### 多空组合

```
多空收益 = Group1_收益 - GroupN_收益
```

其中 Group1 是信号最强的组，GroupN 是信号最弱的组。

### 统计指标

| 指标 | 公式 | 阈值参考 |
|------|------|---------|
| **年化收益率** | mean × 252 | > 10% 有实际意义 |
| **年化波动率** | std × √252 | < 20% 可接受 |
| **夏普比率** | 年化收益/年化波动 | > 1.0 优秀，> 2.0 极好 |
| **最大回撤** | peak-to-trough | < 15% 良好 |
| **胜率** | 正收益天数/总天数 | > 55% 较稳定 |
| **盈亏比** | 平均盈利/平均亏损 | > 1.5 |

### 分组单调性检验

评估信号质量的**关键指标**——各组绩效应呈单调排列：

```
期望: G1 > G2 > G3 > G4 > G5
若 G3 > G2 或 G1 < G5 → 信号存在非线性问题
```

**单调性度量**：
- **Spearman相关系数**：组序号与组收益的秩相关
- **Monotonic Ratio**：相邻组方向一致的占比

## 完整回测框架示例

```python
import numpy as np
import pandas as pd

def timing_factor_backtest(price, signal, window=252, n_groups=5):
    """
    单品种时序因子回测
    
    Parameters
    ----------
    price : pd.Series
        期货价格序列（主连）
    signal : pd.Series
        信号序列（与price对齐）
    window : int
        滚动窗口
    n_groups : int
        分组数
    
    Returns
    -------
    results : dict
        各组的绩效统计
    """
    ret = price.pct_change()
    
    # 滚动分位数
    roll_quantiles = signal.rolling(window).quantile(
        [i/n_groups for i in range(1, n_groups)]
    )
    
    # 分组
    group_rets = pd.DataFrame(index=ret.index, columns=range(n_groups))
    for i in range(n_groups):
        lower = roll_quantiles.iloc[:, i-1] if i > 0 else -np.inf
        upper = roll_quantiles.iloc[:, i]
        mask = (signal >= lower) & (signal < upper)
        group_rets[i] = ret * mask.shift(1)
    
    # 绩效统计
    stats = {}
    for g in range(n_groups):
        g_ret = group_rets[g].dropna()
        stats[f'G{g+1}'] = {
            'ann_return': g_ret.mean() * 252,
            'ann_vol': g_ret.std() * np.sqrt(252),
            'sharpe': g_ret.mean() / g_ret.std() * np.sqrt(252),
            'win_rate': (g_ret > 0).mean(),
            'max_dd': (g_ret.cumsum() - g_ret.cumsum().cummax()).min()
        }
    
    # 多空组合
    ls_ret = group_rets[0] - group_rets[n_groups-1]
    stats['Long-Short'] = {
        'ann_return': ls_ret.mean() * 252,
        'ann_vol': ls_ret.std() * np.sqrt(252),
        'sharpe': ls_ret.mean() / ls_ret.std() * np.sqrt(252),
        'win_rate': (ls_ret > 0).mean(),
        'max_dd': (ls_ret.cumsum() - ls_ret.cumsum().cummax()).min()
    }
    
    return stats, group_rets
```

## 与截面因子回测的区别

| 维度 | 时序因子回测 | 截面因子回测 |
|------|-------------|-------------|
| 标的 | 单一品种 | 多个品种/股票 |
| 分组依据 | 信号历史分位数 | 信号截面排序 |
| 收益来源 | 时间序列预测能力 | 横截面区分能力 |
| 统计检验 | t检验（时序） | IC/IR（截面） |
| 样本量 | N天 | N天 × M标的 |

## 注意事项

### 过拟合防范
- 信号构造参数不要在回测中反复调整
- 使用 **walk-forward** 验证（滚动优化+固定样本外）
- 区分**样本内/样本外**绩效

### 数据偏差
- **前视偏差**：确保信号只用历史数据
- **幸存者偏差**：回测品种不应有退市选择（期货影响小）
- **流动性偏差**：信号产生时对应合约应可交易

### 常见问题
- **信号自相关高** → 实际交易次数少，t统计量失真 → 用Newey-West调整
- **收益非正态** → 夏普比率可能高估 → 补充最大回撤、Calmar比率
- **参数敏感性** → 对滚动窗口、分组数做**敏感性分析**