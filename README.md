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

[`frontend/public/word2vec-guess/word_list.txt`](./frontend/public/word2vec-guess/word_list.txt) は同ライセンスを継承します．

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

元データの規約に基づき，本プロジェクト上で使用，配布される単語リスト（[`frontend/public/kanji-vec/kanji_edu_u3_vecs.bin`](./frontend/public/kanji-vec/kanji_edu_u3_vecs.bin)，[`frontend/public/kanji-vec/kanji_education_vecs.bin`](./frontend/public/kanji-vec/kanji_education_vecs.bin)，[`frontend/public/kanji-vec/kanji_jis1_vecs.bin`](./frontend/public/kanji-vec/kanji_jis1_vecs.bin)）についても，同ライセンス（CC BY-SA 3.0）を継承します．


### 乗換案内（最少通過区間）

[駅データ.jp](https://ekidata.jp/) のデータ（2026-04-09）を加工して使用．

### 鉄道路線クイズ

[国土交通省国土数値情報ダウンロードサイト](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v2_3.html)（令和 4 年）のデータを加工して使用．

ライセンス：[公共データ利用規約（第1.0版）](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0)

### 手書き都道府県

[国土交通省国土数値情報ダウンロードサイト](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html)（令和 8 年）のデータを加工して使用．

ライセンス：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0)

### 漢字熟語リスト

本プロジェクトでは，[Electronic Dictionary Research and Development Group (EDRDG)](https://www.edrdg.org/edrdg/index.html) の [JMdict プロジェクト](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) が提供するデータを元に、[jmdict-simplified](https://github.com/scriptin/jmdict-simplified) によって加工されたデータをさらに加工して使用しています（適用ライセンス：[EDRDG Licence](https://www.edrdg.org/edrdg/licence.html)）．

元データおよび派生成果物の規約に基づき，本プロジェクト上で使用・配布される熟語リスト（[`frontend/public/kanji-puzzle/kanji_pairs_all.json`](./frontend/public/kanji-puzzle/kanji_pairs_all.json)，[`frontend/public/kanji-puzzle/kanji_pairs_common.json`](./frontend/public/kanji-puzzle/kanji_pairs_common.json)）についても，同ライセンス（[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)）を継承します．

### 日本分割（人口）

国土交通省国土数値情報ダウンロードサイトの[行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html)（令和 8 年）および，[1kmメッシュ別将来推計人口データ（R6国政局推計）](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html)を加工して使用．

### 画像から裸眼立体視生成

深度推定モデルとして，[depth-anything-v2-small-ONNX](https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX) を使用しています．

ライセンス：[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)

### 自動連想ゲーム

本プロジェクトで使用・配布しているデータは，以下のリソースを元に加工・作成されています．

#### 語彙リスト

本プロジェクト上で使用・配布される語彙リスト（[`frontend/public/word2vec-common-japanese/words.txt`](./frontend/public/word2vec-common-japanese/words.txt)）は，[Electronic Dictionary Research and Development Group (EDRDG)](https://www.edrdg.org/edrdg/index.html) の [JMdict プロジェクト](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) が提供するデータ（[jmdict-simplified](https://github.com/scriptin/jmdict-simplified) 経由）の `common` タグ等の語彙と，後述の単語ベクトルモデル [chiVe](https://github.com/WorksApplications/chiVe)（`v1.3 mc90`）に含まれる語彙との積集合を取り，品詞情報等を元に抽出・フィルタリングして作成したものです．

* **元データのライセンス**: [EDRDG Licence](https://www.edrdg.org/edrdg/licence.html)（CC BY-SA）
* **配布ライセンス**: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
  * JMdict の派生成果物としての規約（Share-Alike）に基づき本ライセンスを継承します．なお，語彙選定において chiVe（Apache License 2.0）を参照・フィルタリングしています．

#### 単語ベクトル

本プロジェクト上で使用・配布される単語ベクトル（[`frontend/public/word2vec-common-japanese/word_vecs.bin`](./frontend/public/word2vec-common-japanese/word_vecs.bin)）は，上記の語彙リスト（`words.txt`）に対応するベクトルデータを以下のモデルから抽出・加工したバイナリデータです．

* **元データ（モデル）**: [chiVe: Sudachi による日本語単語ベクトル](https://github.com/WorksApplications/chiVe) (`v1.3 mc90`)
* **提供元**: [株式会社ワークスアプリケーションズ](https://www.worksap.co.jp)
* **元データのライセンス**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
* **配布ライセンス**: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
  * 本ファイルは，Apache 2.0 の下で配布されている chiVe の数値ベクトルを抽出し，CC BY-SA 4.0 に基づく語彙リストの構成順に一体化させた派生成果物です．原著作物（chiVe）のライセンス条項（著作権表示および免責事項）を遵守した上で，派生成果物全体として CC BY-SA 4.0 を適用して配布します．

## ライセンス

上に示していないコンテンツ（コード，記事，画像など）についてのライセンスについては現在検討中です．
決まり次第，このセクションを更新します．
