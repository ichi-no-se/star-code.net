---
title: "Web サイトに利用している技術"
date: "2025-04-13"
order: 1
---

## 技術情報

この Web サイトは，Next.js を用いて作成しています．

この Web サイトは，ConoHa VPS 上で動いています．将来的な拡張を前提に VPS 上で動かしていますが，VPS をちゃんと活用できるのはいつになることやら．

## ブログについて

`ReactMarkdown` を用いて Markdown から自動で記事を作成しています．

*斜体* **太字** ***斜体太字*** ~~打ち消し~~

- 箇条
- 書き
1. いち
2. に
3. さん

[トップページへのリンク](https://star-code.net)
![サンプル画像](/sample.png)

```
*斜体* **太字** ***斜体太字*** ~~打ち消し~~

- 箇条
- 書き
1. いち
2. に
3. さん

[トップページへのリンク](https://star-code.net)
![サンプル画像](/sample.png)
```

数式も書けます．`remarkMath` と `rehypeKatex` を利用しています．

$m\ddot x = F$

$\int_a^bf(x)g(x)dx=\left[f(x)G(x)\right]^b_a-\int_a^bf'(x)G(x)dx$

$\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$

md ファイルを置くだけで新たに記事として読み込まれるようにしているので，簡単に記事を更新できます．

ちゃんとした実装は [GitHub](https://github.com/ichi-no-se/star-code.net) にあります．
