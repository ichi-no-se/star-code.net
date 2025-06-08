---
title: "3D Gaussian Splatting 用の Docker 環境を作った"
date: "2025-06-08"
order: 9
---

## はじめに

[3D Gaussian Splatting](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/) を知っていますか？僕は知っています．

複数の画像から 3 次元形状を復元する 1 手法です．3 次元形状を 3D Gaussian で表現することが特徴です．
詳細は[元論文](https://arxiv.org/abs/2308.04079)を読んでも良いですが，[わかりやすい記事](https://qiita.com/scomup/items/d5790da25a846e645de1)があるのでまずはこちらがおすすめです．とっても面白い，今ホットな研究分野です．

## 環境構築

元論文の著者の人たちはなんと実装を GitHub 上に[公開](https://github.com/graphdeco-inria/gaussian-splatting)しています．なのでこれを使えばわたしもあなたも 3D Gaussian Splatting で遊べます．やったね．

ところが，環境構築がうまくいきません．困った．conda で入れた PyTorch 周りでトラブルが発生してまともに動きませんでした．

そこで，いい感じに動くように conda を使わず，pip ベースで環境を整えた Docker 環境を作りました．

[こちらのリポジトリ](https://github.com/ichi-no-se/gaussian-splatting-docker)に置いておきます．ご自由にどうぞ．

オリジナル版と諸々のバージョンがちょっと違うので動かないかもしれません．多分大丈夫と信じていますが，もし動かなかったらプルリクをください．

なお，CUDA に対応した GPU 上での動作を前提としています．CUDA が使えない環境では未検証ですが，多分動きません．
