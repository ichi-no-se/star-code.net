"use client";
import dynamic from "next/dynamic";

const GameContainer = dynamic(() => import('@/components/GhostTag/GameContainer'), {
	ssr: false,
	loading: () => <p>Loading...</p>,
});

export default function GhostTag() {
	return (
		<GameContainer />
	)
}
