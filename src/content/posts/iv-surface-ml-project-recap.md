---
title: "IV Surface / 波动率机器学习项目复盘"
published: 2026-07-21
description: "用铜期货相关的期权隐含波动率信息，构造一个可以预测短周期价格行为的机器学习信号。"
category: "衍生品-期权"
study: derivatives-pricing
tags: []
---

更新时间：2026-05-18

## 1. 项目目标

这条研究主线的核心目标是：

1. 用铜期货相关的期权隐含波动率信息，构造一个可以预测短周期价格行为的机器学习信号。
2. 验证 IV smile / IV surface 是否能提供超出单纯价格量数据的额外信息量。
3. 比较几类建模方式：
   - 直接做方向分类
   - 做连续收益预测
   - 做三分类机会识别
   - 把 IV 因子并入分钟级交易模型

项目过程中，一个关键认识逐步变得很明确：

- 直接用 IV 做短周期 up/down 分类，效果大多接近随机。
- 更有前景的方向是把 IV surface 当作连续收益信号，先做排序，再做阈值筛选交易。

## 2. 数据来源与样本

### 2.1 主要数据目录

本项目主要围绕以下数据目录展开：

- `data/CU_20250901_20260301_m`
- `data/CU_20240101_20251231_m`

其中核心文件包括：

- `data/atm_summary_CU.parquet`
- `data/option_chain_CU.parquet`
- 部分目录中还有 `surface_grid_CU.parquet`

### 2.2 数据粒度

- 频率：分钟级
- 标的：`CU`
- 期权侧：每分钟期权链 / ATM 摘要
- 期货侧：连续主力分钟线，作为真实收益标签来源

### 2.3 当前最典型的一次“正结果”实验样本

这次最值得拿出来讲的结果，不是全年样本，而是一个探索版半年度样本：

- 数据目录：`data/CU_20250901_20260301_m`
- 时间范围：`2025-09-01` 到 `2026-03-01`

对应输出目录：

- `outputs/iv_surface_grid_direction_cnn/CU_surface_grid_raw_return_h10_lb20_20260507_162531`

需要强调的是，这个结果是探索版研究结果，不是最终稳定结论。

## 3. 整体研究路线

### 3.1 第一条线：IV smile sequence CNN

脚本：

- `research/iv_surface_direction_cnn.py`

思路：

- 把某一时点的 smile 结构按序列方式编码
- 预测未来一段时间方向

代表性结果：

- `outputs/iv_surface_direction_cnn/CU_h15_lb12_20260507_094542/summary.csv`

该结果大致表现为：

- `accuracy = 0.4893`
- `balanced_accuracy = 0.4887`
- `auc = 0.4905`

结论：

- 直接用 smile sequence 做方向分类，整体接近随机。

### 3.2 第二条线：IV surface grid CNN

脚本：

- `research/iv_surface_grid_direction_cnn.py`

这是项目里最核心的一条线。

这条线又分成两种目标：

1. `target_type = direction`
2. `target_type = return`

#### 3.2.1 direction 版本

思路：

- 先把每分钟期权链映射到 IV surface
- 再做网格化
- 把 surface 当成图像或短时序图像输入模型
- 预测未来 `h` 分钟涨跌方向

代表性结果：

- `outputs/iv_surface_grid_direction_cnn/CU_surface_grid_h15_20260507_132157/summary.csv`

关键指标：

- `accuracy = 0.5209`
- `balanced_accuracy = 0.5057`
- `auc = 0.5119`
- `strategy_total_return = -0.4345`

结论：

- 分类准确率略高于 50%，但非常弱。
- 直接映射到交易后，结果明显不理想。

#### 3.2.2 return 版本

这是目前最有研究价值的一条结果线。

核心变化：

- 不再预测“涨跌”
- 改为直接预测未来 `h` 分钟收益率 `forward_return`

也就是：

`forward_return = close[t+h] / close[t] - 1`

然后不要求模型对每个时点都给出做多/做空结论，而是：

- 用预测值做横向排序
- 只做最高分和最低分两端样本
- 中间大部分样本不交易

这就是“把 IV surface 当成连续收益信号做排序和筛选”。

## 4. 关键实验：raw IV surface sequence

### 4.1 对应脚本与结果

脚本：

- `research/iv_surface_grid_direction_cnn.py`

代表性结果目录：

- `outputs/iv_surface_grid_direction_cnn/CU_surface_grid_raw_return_h10_lb20_20260507_162531`

结果汇总文件：

- `summary.csv`
- `fold_metrics.csv`
- `oos_predictions.csv`
- `run_metadata.json`

### 4.2 这次实验具体怎么做

#### Step 1：把期权链变成 IV surface

对每个时间点：

- 横轴用 `log_moneyness = log(strike / spot_price)`
- 纵轴用 `time_to_maturity`

然后做网格化：

- `x_bins = 24`
- `y_bins = 8`

并构造多通道 surface 输入：

- `call_filled`
- `put_filled`
- `mid_filled`
- `surface_change_raw`
- `density_norm`

这次用的是 `surface_value_mode = raw`，也就是保留原始 IV 水平，不做 ATM 中心化。

#### Step 2：拼接额外表格特征

除了 surface 序列，还并了一些摘要特征：

- `call_iv`
- `put_iv`
- `iv_level`
- `iv_spread`
- `surface_coverage`
- `surface_mid_iv`
- `surface_atm_iv`
- `source_point_count`
- `uniq_maturity`
- `ttm_min`
- `ttm_max`
- 时间周期特征：`tod_sin`, `tod_cos`
- 连续期货分钟特征：
  - `fut_return_1m`
  - `fut_return_5m`
  - `fut_return_10m`
  - `fut_realized_vol_10`
  - `fut_volume_z20`
  - `fut_amount_z20`

#### Step 3：构造标签

这次不是做二分类，而是直接预测未来收益：

- `target_type = return`
- `target_horizon = 10`

所以标签是：

- 未来 `10` 分钟收益率

#### Step 4：构造时序样本

每个样本不是看一张 surface，而是看最近一段 surface 序列：

- `lookback = 20`

也就是模型看到的是最近 `20` 个分钟时点的 IV surface 演化。

同时做了一些过滤：

- `surface_coverage >= 0.45`

这次探索版还限制了：

- `max_samples = 4000`

#### Step 5：模型结构

模型不是单一 2D CNN，而是两支路结构：

1. `3D CNN` 分支吃 surface sequence
2. `MLP` 分支吃表格特征

最后把两支路拼接起来输出一个连续预测值。

训练目标是回归，因此使用：

- `MSELoss`

#### Step 6：时序 OOS 验证

为了避免未来信息泄露，用的是时间序列切分：

- `n_splits = 2`

每一折：

- 用过去训练
- 用未来测试

并且训练集内部再切一段 validation 做 early stopping。

这次探索版参数是：

- `epochs = 3`
- `batch_size = 64`
- `learning_rate = 1e-3`

#### Step 7：从预测值变成策略

这一步是整个项目最重要的思想变化之一。

不是：

- 预测值大于 0 就买
- 小于 0 就卖

而是：

- 在训练集预测值上取分位数阈值
- `signal_quantile = 0.2`

也就是：

- 预测值高于 `80%` 分位数：做多
- 预测值低于 `20%` 分位数：做空
- 中间全部空仓

所以本质上这是一种：

- `ranking + threshold filtering`

而不是简单二分类交易。


### 6.2 2D-CNN ensemble 三分类

脚本：

- `iv_surface_2dcnn_ensemble_mainline.py`

代表结果：

- `outputs/iv_surface_2dcnn_ensemble_mainline/CU_surface_2dcnn_ensemble_h10_q20_k10_20260518_103445/summary.csv`

表现：

- `strategy_total_return = -0.2196`
- `accuracy = 0.4076`
- `macro_f1 = 0.3942`

结论：

- 三分类想法是对的，但这版实现目前没有跑出稳定正结果。

### 6.3 带 IV 因子的分钟级交易模型

脚本：

- `strategies/cu_ml_trading_strategy_v2_with_iv.py`

输出目录：

- `data/cta_outputs/cu8888_ml_trading_v2_with_iv`

验证期最好参数：

- `selected_validation_config.csv`

代表性表现：

- `Sharpe = 1.8644`
- `return = 0.6247%`
- `max_dd = -1.1851%`

但测试期最后净值：

- `nav_test.csv` 最终 `equity = 0.99575`

也就是：

- 扣成本后测试期是小幅亏损

结论：

- IV 因子可能有一点辅助信息
- 但目前还不足以支撑稳定可交易的分钟级策略

## 7. 阶段性结论

截至目前，这个项目最核心的阶段性结论是：

1. 直接用 IV / surface 做短周期 up/down 分类，整体优势不明显，很多结果接近随机。
2. 把 IV surface 作为连续收益预测信号使用，比直接做方向分类更合理。
3. 最值得继续做的是：
   - 收益排序
   - 分位数筛选
   - 高置信度样本交易
4. 更复杂的模型结构目前没有自动带来更好的 OOS 表现。
5. 现阶段最有价值的不是“分类胜率”，而是：
   - `rank_ic`
   - 分位数组收益差
   - 扣成本后的高分位交易收益

## 8. 当前局限

这条 `+50.31%` 的结果虽然很亮眼，但必须带着边界去理解：

1. 这是半年度样本，不是全年或多年稳定样本。
2. 这是探索版参数：
   - `max_samples = 4000`
   - `n_splits = 2`
   - `epochs = 3`
3. 标签是重叠的 `10` 分钟 forward return，样本之间不是完全独立的。
4. benchmark 是同口径 forward return 累积路径，更像研究对照，不等于严格实盘基准。
5. 目前最重要的是验证稳定性，而不是只看单次最好结果。

## 9. 下一步最合理的方向

后续如果继续推进，建议按这个顺序走：

1. 用 `data/CU_20240101_20251231_m` 做两年版重跑，验证样本外稳定性。
2. 固定 `raw return` 这条线，系统扫参数：
   - `target_horizon`
   - `lookback`
   - `signal_quantile`
   - `surface_value_mode`
3. 做更严格的 decile / quantile analysis：
   - 最高分组未来平均收益
   - 最低分组未来平均收益
   - 扣成本后是否仍有 edge
4. 继续减少“全样本都参与”的倾向，提升 no-trade 过滤能力。
5. 如果排序能力稳定，再考虑：
   - triple barrier 标签
   - 三分类机会模型
   - 事件驱动持仓规则

## 10. 复现实验命令

### 10.1 复现半年度最佳探索版结果

```bash
python3 /Users/yixuantang/Desktop/code/research/iv_surface_grid_direction_cnn.py \
  --symbol CU \
  --freq m \
  --dataset-dir /Users/yixuantang/Desktop/code/data/CU_20250901_20260301_m \
  --target-type return \
  --surface-value-mode raw \
  --target-horizon 10 \
  --lookback 20 \
  --x-bins 24 \
  --y-bins 8 \
  --min-surface-coverage 0.45 \
  --n-splits 2 \
  --epochs 3 \
  --batch-size 64 \
  --learning-rate 0.001 \
  --signal-quantile 0.2 \
  --fee-rate 0.0002 \
  --max-samples 4000
```

### 10.2 两年数据版重跑命令

```bash
python3 /Users/yixuantang/Desktop/code/research/iv_surface_grid_direction_cnn.py \
  --symbol CU \
  --freq m \
  --dataset-dir /Users/yixuantang/Desktop/code/data/CU_20240101_20251231_m \
  --target-type return \
  --surface-value-mode raw \
  --target-horizon 10 \
  --lookback 20 \
  --x-bins 24 \
  --y-bins 8 \
  --min-surface-coverage 0.45 \
  --n-splits 2 \
  --epochs 3 \
  --batch-size 64 \
  --learning-rate 0.001 \
  --signal-quantile 0.2 \
  --fee-rate 0.0002 \
  --max-samples 4000
```

## 11. 一句话总结

这个项目最重要的收获，不是“IV 能不能直接猜涨跌”，而是：

**IV surface 更适合作为一个连续 alpha score 生成器，用来排序和筛选未来收益机会，而不是做简单方向开关。**