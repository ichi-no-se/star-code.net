# star-code.net

自作ウェブサイトプロジェクト

以下のアプリやツールを [star-code.net](star-code.net) で公開・運用しています

## プロジェクト

- 15 秒チャット
- 数独ソルバー
- 手書き数字分類
- 絵文字ジェネレーター
- ポケモン色違い抽選シミュレーター
- Word2Vec 類似度単語当てゲーム
- 画像ピクセル並び替え
- 画像アスキーアート化
- Legion's Path
- 全世界同期リバーシ
- リバーシ（vs 静的 AI）
- 図形による画像近似
- 言葉をオブラートに包む
- Ghost Tag
- QR Canvas
- fastText 類似度漢字当てゲーム

## 技術スタック

- フロントエンド：Next.js
- バックエンド：Node.js

## ライセンス

このリポジトリに含まれるコンテンツのうち，以下のコンテンツについてはライセンスを明示しています．

### Word2Vec 類似度単語当てゲーム

#### 語彙リスト

以下の 2 種類の語彙リストを使用しています．

- **ver.1**
[Wiktionary:日本語の基本語彙1000](https://ja.wiktionary.org/wiki/Wiktionary:%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E5%9F%BA%E6%9C%AC%E8%AA%9E%E5%BD%991000) を基にしています（閲覧日：2025年6月29日）．
ライセンス： [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

- **ver.2**
自作の語彙リスト（手動で作成・分類）
ライセンス：[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

#### 単語ベクトル

[chiVe: Sudachi による日本語単語ベクトル](https://github.com/WorksApplications/chiVe) の `v1.3 mc90` モデルを加工して使用。
提供元： [株式会社ワークスアプリケーションズ](https://www.worksap.co.jp)
ライセンス： [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

### 漢字類似度当てゲーム・漢字演算

#### 漢字リスト

- **教育漢字**
[https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f](教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita) 上のリストを加工して使用しています（閲覧日：2026 年 4 月 15 日）．

- **ＪＩＳ第１水準漢字**
[https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f](教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita) 上のリストを加工して使用しています（閲覧日：2026 年 4 月 15 日）．

- **小学校 3 年生以下で習う漢字**
[https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f](教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita) 上のリストを加工して使用しています（閲覧日：2026 年 4 月 18 日）．

#### 単語ベクトル

fastText の学習済みモデル（Japanese，bin）を加工して使用．

出典：Grave, E., Bojanowski, P., Gupta, P., Joulin, A., & Mikolov, T. (2018). Learning Word Vectors for 157 Languages. *Proceedings of the International Conference on Language Resources and Evaluation (LREC 2018)*.
ライセンス：[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

その他のコンテンツ（コード，記事，画像など）のライセンスについては現在検討中です．
決まり次第，このセクションを更新します．
