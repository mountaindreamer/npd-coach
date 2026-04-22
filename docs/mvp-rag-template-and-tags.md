# MVP RAG 模板与标签体系

## 1. RAG Chunk 模板

```text
[场景]
一句话描述具体情境（谁、何时、冲突点）。

[话术示例]
给出 2-4 句典型表达（可用于生成时参考，不可照抄）。

[行为要点]
1) 操控动作是什么
2) 对用户心理影响是什么
3) 与普通矛盾怎么区分
```

## 2. 标签体系（MVP）

### 必填标签

- 关系类型：`intimate | parent-child | workplace`
- 一级模式：`gaslighting | lovebomb | triangulation | silent-treatment | emotional-blackmail`

### 可选标签

- 难度层：`beginner | intermediate | advanced`
- 区分层：`differentiation`
- 语言风格：`conversation | language`
- 通用素材：`all`

## 3. 检索规则（MVP）

1. 先按关系类型筛候选（硬过滤）。
2. 再用意图标签补充候选（软扩展）。
3. 混合得分排序：
   - 向量相似度（主）
   - 词面重合（辅）
   - 优先标签加权（例如 differentiation）
4. 按难度动态 topK：
   - 初级 3
   - 中级 4
   - 高级 5

## 4. 数据治理建议

- 每条 chunk 尽量只表达一个模式，避免多模式混杂。
- 一周一次去重，合并高度相似条目。
- 每次新增条目都要跑回归集，防止召回漂移。
