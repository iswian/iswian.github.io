---
title: "Barra CNE6 纯因子模型构建与因子合成"
published: 2026-07-21
description: "分层回测无法保证单一因子对其他因子的暴露中性，需要用纯因子模型（单一因子暴露为1，其他因子暴露为0）来客观反映因子的真实收益能力。"
category: "因子选股"
tags: []
---

> **来源**: 渤海证券《Barra 风险模型（CNE6）之纯因子构建与因子合成——多因子模型研究系列之九》，2019.06
> **标签**: #多因子模型 #Barra #CNE6 #纯因子 #风险模型

## 核心思想

分层回测无法保证单一因子对其他因子的暴露中性，需要用纯因子模型（单一因子暴露为1，其他因子暴露为0）来客观反映因子的真实收益能力。

## 纯因子模型求解

### 回归方程

$$r_j = \sum X_{jk} f_k + u_j$$

其中 $X$ 为因子暴露矩阵（1个国家因子 + S个行业因子 + M个风格因子）。

### 约束条件

- **行业权重约束**: 引入国家因子后，行业因子之和为1导致解不唯一，需加入行业市值权重约束
- **异方差处理**: 使用 $\sqrt{\text{流通市值}}$ 为权重进行加权最小二乘回归

### 权重矩阵求解

带约束最小二乘法求得纯因子组合权重矩阵 $W$，每一行对应一个纯因子组合。

## CNE6 因子结构

| 一级因子 | 二级因子 | 说明 |
|---------|---------|------|
| Size | LNCAP, MIDCAP | 流通市值对数 + 非线性市值（中市值） |
| Volatility | BETA, Residual Volatility | Beta + 残余波动率（HSIGMA/DASTD/CMRA） |
| Liquidity | STOM, STOQ, STOA, ATVR | 月/季/年换手率 + 年化交易量比率 |
| Momentum | STREV, Seasonality, Industry Momentum, Momentum(RSTR+HAlpha) | 短期反转 + 季节 + 行业动量 + 传统动量 |
| Quality | Leverage, Earnings Variability, Earnings Quality, Profitability, Investment Quality | CNE6 中改动最大的因子 |
| Value | BTOP, Earnings Yield(BTOP/EPFWD/CETOP/EM), Long Term Reversal | 加入了长期反转 |
| Growth | EGRLF, EGRO, SGRO | 预测利润增长率/每股净利润/收入增长率 |
| Dividend Yield | DTOP, DPIBS | 股息率 + 分析师预测股息率 |

## 回测结果（2009.01-2019.04）

- **流动性**(Liquidity): 纯因子累计-62.77%，最稳定的负收益因子
- **动量**(Momentum): 累计-52.26%，短期反转贡献最大
- **质量**(Quality): 累计+32.46%，Profitability 表现最好（夏普1.14）
- **波动率**(Volatility): 累计+29.32%，BETA 与 ResVol 走势基本一致
- **估值**(Value): 累计+24.98%，加入长期反转后大幅提高
- **分红**(DTOP): 累计+8.21%，2014年后收益明显

### 权重调整

将 MIDCAP（规模因子）和 Earnings Quality（质量因子）的权重由正向调整为负向后，Adjusted $R^2$ 由34%上升至36%。

## 参考

- [多因子模型体系框架](../因子选股/华泰多因子.md)
- [单因子有效性检验方法论](../因子选股/因子检验方法.md)
