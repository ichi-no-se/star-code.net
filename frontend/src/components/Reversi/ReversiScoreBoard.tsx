import "@styles/reversi.css";
import { GameStatus, Player } from "../../lib/ReversiLogic";

type ReversiScoreBoardProps = {
	blackScore: number;
	whiteScore: number;
	gameStatus: GameStatus;
	passPlayer?: Player|null;
};
export const ReversiScoreBoard = ({ blackScore, whiteScore, gameStatus, passPlayer }: ReversiScoreBoardProps) => {
	let displayText = "";
	let displayClass = "";
	if (gameStatus === "GameOver") {
		if (blackScore > whiteScore) {
			displayText = "Winner: Black";
			displayClass = "result-black";
		} else if (whiteScore > blackScore) {
			displayText = "Winner: White";
			displayClass = "result-white";
		} else {
			displayText = "Draw";
			displayClass = "result-draw";
		}
	}
	else if( passPlayer ) {
		displayText = `${passPlayer} Pass!`;
		displayClass = "result-pass";
	}

	return (
		<div className="reversi-scoreboard">
			<div className="reversi-scores-row">
				<div className={`reversi-score black-score ${gameStatus === "Black" ? "active-turn" : ""}`}>
					Black: {String(blackScore).padStart(2, "0")}
				</div>
				<div className={`reversi-score white-score ${gameStatus === "White" ? "active-turn" : ""}`}>
					White: {String(whiteScore).padStart(2, "0")}
				</div>
			</div>
			<div className={`reversi-result ${displayClass} ${displayText ? "show" : ""}`}>
				{displayText || "\u00A0"}
			</div>
		</div>
	);
};