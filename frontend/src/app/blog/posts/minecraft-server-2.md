---
title: "Minecraft サーバーの建て方（PaperMC）"
date: "2025-05-31"
order: 6
---

## はじめに
この Web サイトは，ConoHa VPS 上で動いています．

将来的に動的なコンテンツを置くことを計画していますが，現状スペックを持て余しています．

そこで，余っているスペックを活かして Minecraft のサーバーを建ててみました．

## スペック

[ConoHa VPS](https://www.conoha.jp/vps/) の 2GB のプラン（メモリ 2 GB，CPU 3 コア，SSD 100 GB）です．

1 GB 分を Minecraft サーバー用に割り当てています．OS は Ubuntu 24.04 です．

## サーバーの建て方
Minecraft 公式の[サーバー](https://www.minecraft.net/ja-jp/download/server)ではなく，[PaperMC](https://papermc.io/) を使いました．

理由は 2 つあり，1 つがプラグインを導入したかったため，もう 1 つがパフォーマンスを改善している（らしい）ためです．
公式版でも大体やることは同じなはず．

以下，Ubuntu 24.04 でサーバーを建てる方法について書きます．大体の Linux なら似た感じじゃないかな．Windows はわからん．

### ダウンロード
PaperMC の[ダウンロードページ](https://papermc.io/downloads/paper)から最新版をダウンロードします．

この記事を書いている 2025 年 5 月 31 日現在の最新版（1.21.4 Build #231）は以下のコマンドでダウンロードできます．

```bash
wget https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/231/downloads/paper-1.21.4-231.jar
```

適当なディレクトリを作ってそこに置いておきます（下の例では `minecraft_server` をホームディレクトリ直下に作っていますが，お好みの場所お好みの名前で）（下の例ではついでに `paper.jar` にリネームしていますがしなくてもいいです）．

```bash
mkdir ~/minecraft_server
mv paper-1.21.4-231.jar ~/minecraft_server/paper.jar
```

### 実行
PaperMC の[ドキュメント](https://docs.papermc.io/paper/getting-started/)に沿います．

カレントディレクトリにファイルをたくさん作るので，サーバーの実行前に `cd` をしましょう（1 敗）．

```bash
cd ~/minecraft_server
java -Xms512M -Xmx1G -jar paper.jar --nogui
```

`-Xms` で起動時のヒープサイズ，`-Xmx` で使用する最大のヒープサイズを指定します．使えるメモリの大きさと相談です．

Java のバージョンが合っていなかったりすると動かないかもしれません．2025 年 5 月 31 日現在，最新版は Java 21 が推奨されています．以下のコマンドでインストールできます．

```bash
sudo apt install openjdk-21-jre-headless -y
```

`java -version` でバージョンが確認できます．

初回の実行の後，`eula.txt` が生成されます．EULA（エンドユーザーライセンス契約）に同意してくださいね，というやつです．全文は[こちら](https://aka.ms/MinecraftEULA)から．

`eula.txt` の中の `eula=false` を `eula=true` に書き換えることで同意したことになります．

ここで，ポート開放を忘れずに行っておきます．Minecraft のサーバーが使うデフォルトのポートは 25565 です．VPS の設定側でも忘れずに許可しておきます．

```bash
sudo ufw allow 25565/tcp
```

再度コマンド `java -Xms512M -Xmx1G -jar paper.jar --nogui` を実行し，Minecraft からサーバーにアクセスできるか確認します．サーバーを停止させるには，`stop` コマンドを入力すればよいです．

しかし，この状態ではこれだとシェルの接続が切れたタイミングで終了してしまいます．
そこで，今回は `screen` を用いて仮想的なターミナルを作ります（`tmux` という似たようなことができるものもあるらしい）．

```bash
sudo apt install screen -y
screen -S minecraft
```

これで，`minecraft` という名前のセッションが起動できます（名前はなんでも良いです）．この状態で `java -Xms512M -Xmx1G -jar paper.jar --nogui` を実行したのち，`Ctrl + a` を押したのち `d` キーで抜けることができます．

`screen -r minecraft` コマンドで再度セッションに入ることができます．

プラグインを入れたい場合，`plugins` というディレクトリが生成されているので，その中にプラグインを入れ，サーバーを再起動します．

なお，このままだと VPS の再起動時にサーバーは再起動しません．
`cron` や `systemd` などを使って起動時に実行させる方法はありますが，ここでは割愛します．カレントディレクトリを合わせることに注意してください．

## ワールドデータ
PaperMC を用いると，ワールドデータが通常とは異なるディレクトリ構成をしています．そのため，ダウンロードして手元で遊んだり，配布したりするためにはディレクトリ構成をオリジナルと揃える必要があります．

PaperMC の[ドキュメント](https://docs.papermc.io/paper/migration/)に書いてあるように，以下の手続きで形式を整えることができます．

- `/world_nether/DIM-1` を `/world/DIM-1` にコピー
- `/world_the_end/DIM1` を `/world/DIM1` にコピー
- `/world` 以下をダウンロード

## おわりに
この手順で実際に Minecraft のサーバーを動かしています．
詳しくは[こちら](/blog/minecraft-server)．

その他関連記事は以下．
- [チャットを禁止する Minecraft サーバーのプラグインを作った](/blog/minecraft-server-3)
- [Minecraft サーバーを 72 時間でリセット](/blog/minecraft-server-4)
