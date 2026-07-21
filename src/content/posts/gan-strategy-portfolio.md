---
title: "GAN用于交易策略微调与组合"
published: 2026-07-21
description: "来源：Koshiyama, Firoozye & Treleaven (2021), Quantitative Finance"
category: "投资组合"
study: portfolio-optimization
tags: []
---

**来源**：Koshiyama, Firoozye & Treleaven (2021), *Quantitative Finance*

## 创新

用**条件生成对抗网络(cGAN)**来做交易策略的**参数校准**和**策略组合**。

## 方法流程

1. **训练cGAN**：学习金融时间序列的条件分布
2. **采样生成**：从cGAN生成大量合成样本
3. **校准**：每条合成样本上优化策略参数
4. **集成**：所有生成样本的策略做集成(ensemble)

## 实验

- **579个资产** × 多个交易策略
- cGAN与传统ensemble方案和时间序列交叉验证对比
- **结论**：cGAN在传统方法失效时仍能创造alpha

## 与端到端的关系

- 端到端和SPO通常依赖真实数据的梯度传播
- GAN提供**数据增强**策略：在没有真实梯度时也能优化策略组合