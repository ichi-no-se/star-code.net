---
title: "類似度漢字当てゲームを作った"
date: "2026-04-15"
order: 25
---

## はじめに

以前，Word2Vec を使って単語当てゲームを作りました（[記事 1](/blog/word2vec-guess)）（[記事 2](/blog/word2vec-guess-v2)）（[ゲーム](/projects/word2vec-guess-v2)）．

これの漢字版を今回作りました（[リンク](/projects/kanji-guess)）．

## いきさつ

Word2Vec には面白い性質があり，ベクトル同士を足し算すると意味を足し算できたりするらしいです（王 - 男 + 女 = 女王 とか）．

これをブラウザ上で試せたら楽しいなと思っていましたが，
語彙をどう選定するか，制限するかを悩んだ挙句放置してしまいました．
いい感じの日本語基礎語彙リストってどこかに無いものでしょうかね．

しばらく放置していたのですが，先ほど語彙を漢字に絞ることを思いつきました．
漢字一文字でしたら範囲も明確にしやすいので自分から言葉を入力する際も，単語（今回の場合は漢字）が語彙に含まれているかいないかが分かりやすいです．

と，いうことで漢字のベクトル化のテストということで以前と同様のゲームを作りました．ルールも同じです．

最初はＪＩＳ第１水準漢字で作っていたのですが，あまりに知らない感じが多すぎるので教育漢字で作り直しました．

## 作り方

語彙（漢字）リストはまとめている記事を見つけまして，その記事（[教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita](https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f)）上のリストを拝借しました．

単語ベクトルは，[fastText](https://fasttext.cc) の学習済みモデルを用いました．
Word vectors for 157 languages のうち，Japanese のデータを使用，加工しました．

データには bin と text の 2 種類あり，今回は bin の方を用いました．
最初は text の方を使用しようとしたのですが，一部の漢字（「究」とか）が含まれていない（おそらく単体で登場する頻度が低く，熟語として登録されていそう）ことが発覚したので，bin の方を用いました．bin の方からはベクトルが取り出せました．

ちゃんと理解していないのですが，bin の方は Subword に分解して保存していて，そこからなら漢字 1 文字でも取り出せたということなのでしょうか．多分そう．

```text
Grave, E., Bojanowski, P., Gupta, P., Joulin, A., & Mikolov, T. (2018). Learning Word Vectors for 157 Languages. Proceedings of the International Conference on Language Resources and Evaluation (LREC 2018)
```

さて，この訓練済みのデータのライセンスは [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) です．
なので私が作った加工済みのデータ（バイナリ）も [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) で公開しなければなりません．
ライセンスは遵守しよう！

## データ

- **語彙リスト（教育漢字）**：[kanji_education_vocab.txt](/kanji-vec/kanji_education_vocab.txt)
- **語彙リスト（ＪＩＳ第１水準）**：[kanji_jis1_vocab.txt](/kanji-vec/kanji_jis1_vocab.txt)

これらのリストは，[こちら](https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f)の記事にまとめられれいた一覧を拝借しました．

- **意味ベクトル（教育漢字）**：[kanji_education_vecs.bin](/kanji-vec/kanji_education_vecs.bin)
- **意味ベクトル（ＪＩＳ第１水準）**：[kanji_jis1_vecs.bin](/kanji-vec/kanji_jis1_vecs.bin)

これらの意味ベクトルは [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) の下で公開しています．

意味ベクトルは，全てリトルエンディアンのバイナリ形式で保存されています．
ブラウザでの読み込み速度を優先し，読み込んだバイナリをそのままメモリに展開できるように設計しました．

データの先頭には，読み込み時に必要な情報（ヘッダー）が 8 バイト格納されています：

1. **収録漢字数**（Int32 / 4 バイト）：バイナリに含まれる漢字の総数
2. **次元数**（Int32 / 4 バイト）：1 漢字に対応する意味ベクトルの長さ（今回は 300 固定）

この 8 バイトに続いて，各漢字のベクトルが続きます．各成分は 4 バイトの Float32 です．漢字の順番は語彙リストと対応しています．

## おわりに

結局ＪＩＳ第１水準の方は使っていないのではって？次回をお楽しみに！
