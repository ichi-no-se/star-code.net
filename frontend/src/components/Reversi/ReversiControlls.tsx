import "@styles/reversi.css";

type ReversiControllsProps = {
	canGoBack: boolean;
	onGoBack: () => void;
	onGoToStart: () => void;
	canGoForward: boolean;
	onGoForward: () => void;
	onGoToEnd: () => void;
};

export const ReversiControlls = ({ canGoBack, onGoBack, onGoToStart, canGoForward, onGoForward, onGoToEnd }: ReversiControllsProps) => {
	return (
		<div className="reversi-controlls">
			<button onClick={onGoToStart} disabled={!canGoBack} className="reversi-controlls-button">&lt;&lt;</button>
			<button onClick={onGoBack} disabled={!canGoBack} className="reversi-controlls-button">&lt;</button>
			<button onClick={onGoForward} disabled={!canGoForward} className="reversi-controlls-button">&gt;</button>
			<button onClick={onGoToEnd} disabled={!canGoForward} className="reversi-controlls-button">&gt;&gt;</button>
		</div>
	);
};