---
title: "チャットを禁止する Minecraft サーバー（PaperMC）のプラグインを作った"
date: "2025-05-31"
order: 7
---

## はじめに
Minecraft サーバーを[建てました](/blog/minecraft-server)．
[PaperMC](https://papermc.io/) を用いて，プラグインを導入できる運用にしています．

誰でもアクセスできる運用にしていますので，サーバーの秩序が気になります．そこで，**チャットやコマンドを全て禁止するプラグイン**を自作しました．

プラグインは[こちら](https://github.com/ichi-no-se/no-chat-and-command)からダウンロードできます．`.jar` ファイルを `plugins/` に置くと機能します．

## 作り方

PaperMC 公式[ドキュメント](https://docs.papermc.io/paper/dev/project-setup/)を参考にします．

IDE として，JetBrains 社の [IntelliJ IDEA](https://www.jetbrains.com/ja-jp/idea/) が推奨されているので，これを用います．Community 版は無料で利用することができます．

プラグインとして，`Minecraft Development` を入れます．すると，「新規プロジェクト」のテンプレートに `Minecraft` が追加されます．

- `Gruops` は `Plugin` を選択
- `Templates` は `Paper` を選択
- `Group ID` はドメインの逆順で設定します（例：`your.domain.jp` → `jp.domain.your`）．持っていない場合は GitHub アカウントに結びつけて `io.github.username` のようにします．

プロジェクトのルート直下に `gradlew` あるいは `gradlew.bat` というファイルが生成されます．
以下のコマンドでビルドが行えます（Window は未確認）．

- Linux / macOS： `./gradlew build`
- Windows（コマンドプロンプト）： `gradlew.bat build`
- Windows（PowerShell）：`.\gradlew build`

ビルド後に `build/libs/` に `.jar` ファイルが生成されます．これをサーバーの `plugins/` に置くことでサーバーにプラグインを反映させることができます．

`src/main/...` 以下にある `.java` ファイルを書き換えてプラグインを実装します．
詳しくは PaperMC 公式[ドキュメント](https://docs.papermc.io/paper/dev/)を参照してください．

[実装](https://github.com/ichi-no-se/no-chat-and-command/blob/main/src/main/java/net/starcode/noChatAndCommand/NoChatAndCommand.java)を見てもらう方が早いですが，`AsyncChatEvent` でチャットのイベントを，`PlayerCommandPreprocessEvent` でコマンドのイベントを取得しています．

## おわりに
実際にこのプラグインを導入した Minecraft のサーバーを動かしています．
詳しくは[こちら](/blog/minecraft-server)．

その他関連記事は以下．
- [Minecraft サーバーの建て方](/blog/minecraft-server-2)
- [Minecraft サーバーを 72 時間でリセット](/blog/minecraft-server-4)
