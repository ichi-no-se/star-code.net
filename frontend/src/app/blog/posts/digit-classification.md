---
title: "手書き文字分類のデモを作りました"
date: "2025-06-08"
order: 10
---

## はじめに
手書き文字分類のデモを作りました．

[こちら](/projects/digit-classification)から遊べます．

## 技術情報
分類器としては，以下のようなシンプルな多層パーセプトロンを実装しました．

```python
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(28*28,256)
        self.fc2 = nn.Linear(256,128)
        self.fc3 = nn.Linear(128,10)
    def forward(self,x):
        x = self.flatten(x)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x
```

とってもシンプルな全結合ネットワークです．

学習には MNIST データセットを用いました．これは，28 × 28 の手書き文字と，その手書き文字が示す数字（0 から 9 のいずれか）を示すラベルの組が大量にあるデータセットです．

Test データで 97.6 \% の精度です．畳み込みニューラルネットワーク（CNN）とかにすればもうちょっと精度は上がるはず．


文字分類デモは，フロントエンドで動作しています．
Python で学習したデータをバイナリ化して Web サイト上に配置したものを，TypeScript から読み出しています．

## おわりに

今回作成したネットワークなどは[別の企画](/blog/digit-classification-golf)のために作った副産物だったりします．
そちらの企画のために書いたコードと混ざってしまいますが，[こちらのリポジトリ](https://github.com/ichi-no-se/ayasegawa-tech/blob/main/002-digit_classification)に学習用のコードなどを置いています．


Q. 文字が期待している通りに認識されないんだけど？

A. MNIST 風に書いてみると認識されがちです
