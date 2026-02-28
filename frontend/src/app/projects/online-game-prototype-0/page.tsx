"use client";
import dynamic from "next/dynamic";

const GameContainer = dynamic(() => import('@/components/OnlineGamePrototype0/GameContainer'), {
	ssr: false,
	loading: () => <p>Loading...</p>,
});

export default function OnlineGamePrototype0() {
	return (
		<main>
			<h1 className="title">オンラインゲームプロトタイプ 0</h1>
			<h2 className="introduction">
				矢印キーあるいは WASD キーで操作できます．
			</h2>

			<GameContainer />

		</main>
	)
}
