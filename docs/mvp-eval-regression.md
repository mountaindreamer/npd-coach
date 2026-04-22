# MVP 评测集与回归集（执行版）

## 1. 目标

- 评测集：用于判断模型当前质量（是否可上线）。
- 回归集：用于每次改 prompt / RAG 后的稳定性验收（是否变差）。

## 2. 数据来源

- 社群匿名对话样本（需用户同意、脱敏）。
- 历史真实案例（去标识化后）。
- 产品团队手工构造边界案例（高隐蔽、强操控、普通矛盾混淆）。

## 3. 文件结构

- `data/evals/user-dialogues.seed.jsonl`：原始样本池（持续追加）。
- `data/evals/regression-suite.json`：固定回归集（版本化，修改需评审）。

## 4. 标注字段建议

每条样本至少包含：

- `relType`: `intimate | parent-child | workplace`
- `difficulty`: `beginner | intermediate | advanced`
- `intentTags`: 例如 `gaslighting`、`triangulation`、`silent-treatment`
- `expectedBehaviors`: 模型应该表现出的行为点
- `mustNot`: 禁止行为（出戏、说教、暴力内容）

## 5. 评测维度（MVP）

- 角色一致性：是否持续在角色中，不跳出 AI 口吻。
- 场景贴合度：细节与关系类型是否一致。
- 策略合理性：是否符合本关训练目标，不乱飘。
- 输出稳定性：是否满足格式约束（例如 HP 行）。

## 6. 执行节奏

- 每周新增 20-30 条匿名样本进入 `seed`。
- 每周挑选 10 条进入 `regression-suite`。
- 每次发版前，至少跑一轮全量回归并记录对比。
