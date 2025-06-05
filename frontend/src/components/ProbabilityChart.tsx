import "@styles/probability-chart.css";

type Props = {
    probabilities: number[];
};

export default function ProbabilityChart({ probabilities }: Props) {
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    return (
        <div className="chart-container">
            {probabilities.map((p, i) => (
                <div className="bar-row" key={i}>
                    <span className="digit-label"
                        style={{ fontWeight: i === maxIndex ? "bold" : "normal" }}
                    >{i}</span>
                    <div className="bar-wrapper">
                        <div className="bar" style={{
                            width: `${(p * 100).toFixed(5)}%`,
                            backgroundColor: i === maxIndex ? "#2196f3" : "#4caf50"
                        }} />
                    </div>
                    <span className="prob-label">{p.toFixed(5)}</span>
                </div>
            ))}
        </div>
    );
}
