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
- 漢数電卓
- 乗換案内（最少通過区間）
- 万華鏡風画像作成

## 技術スタック

- フロントエンド：Next.js
- バックエンド：Node.js

## 使用データ

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
[教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita](https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f) 上のリストを加工して使用しています（閲覧日：2026 年 4 月 15 日）．

- **ＪＩＳ第１水準漢字**
[教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita](https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f) 上のリストを加工して使用しています（閲覧日：2026 年 4 月 15 日）．

- **小学校 3 年生以下で習う漢字**
[教育漢字、常用漢字、JIS第n水準漢字の一覧を取得するプログラムを考えよう - Qiita](https://qiita.com/YSRKEN/items/ee9589dd59015ca2f15f) 上のリストを加工して使用しています（閲覧日：2026 年 4 月 18 日）．

#### 単語ベクトル

fastText の学習済みモデル（Japanese，bin）を加工して使用．

出典：Grave, E., Bojanowski, P., Gupta, P., Joulin, A., & Mikolov, T. (2018). Learning Word Vectors for 157 Languages. *Proceedings of the International Conference on Language Resources and Evaluation (LREC 2018)*.
ライセンス：[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)


### 乗換案内（最少通過区間）

[駅データ.jp](https://ekidata.jp/) のデータ（2026-04-09）を加工して使用．

### 鉄道路線クイズ

[国土交通省国土数値情報ダウンロードサイト](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v2_3.html)（令和 4 年）のデータを加工して使用．

ライセンス：[公共データ利用規約（第1.0版）](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0)

### 手書き都道府県

[国土交通省国土数値情報ダウンロードサイト](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html)（令和 8 年）のデータを加工して使用．

ライセンス：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0)

## ライセンス

上に示していないコンテンツ（コード，記事，画像など）についてのライセンスについては現在検討中です．
決まり次第，このセクションを更新します．
