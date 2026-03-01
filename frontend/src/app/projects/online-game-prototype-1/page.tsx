"use client";
import dynamic from "next/dynamic";

const GameContainer = dynamic(() => import('@/components/OnlineGamePrototype1/GameContainer'), {
	ssr: false,
	loading: () => <p>Loading...</p>,
});

export default function OnlineGamePrototype1() {
	return (
		<GameContainer />
	)
}
