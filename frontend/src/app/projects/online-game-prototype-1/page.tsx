"use client";
import dynamic from "next/dynamic";

const GameContainer = dynamic(() => import('@/components/OnlineGamePrototype1/GameContainer'), {
	ssr: false,
	loading: () => <p>Loading...</p>,
});

export default function OnlineGamePrototype1() {
	return (
		<main>
			<h1 className="title">オンラインゲームプロトタイプ 1</h1>
			<h2 className="introduction">
				部屋機能を追加．
				矢印キーもしくは WASD で操作できます．
			</h2>

			<GameContainer />

		</main>
	)
}
