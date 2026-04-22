"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, Fragment } from "react";
import "@styles/transfer-guide.css";


interface RawStation {
    n: string; // station_name
    g: number; // station_g_cd
    l: number; // line_cd
    e: number[]; // edges
}

interface RawData {
    stations: { [key: string]: RawStation }; // {station_cd: RawStation}
    lines: { [key: string]: string }; // {line_cd: line_name}
}

interface Station {
    name: string;
    line_cd: number;
    g_cd: number;
    edges: number[];
}

const toFullWidth = (str: string) => {
    return str
        .replace(/[A-Za-z0-9]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0))
        .replace(/[-－﹣－−－―]/g, 'ー')
        .trim();
};

type RouteResult =
    | { type: "IDLE" }
    | { type: "NO_ROUTE" }
    | { type: "SUCCESS", result: number[], cost: number };



const filterStations = (text: string, stationMap: Map<number, Station>) => {
    if (text.length >= 2 && text[text.length - 1] === "駅") {
        text = text.slice(0, -1);
    }
    if (text.trim() === "") {
        return [];
    }

    const resultWithPriority: { station_cd: number; station: Station; priority: number }[] = [];
    const normalizedText = toFullWidth(text);
    for (const [station_cd, station] of stationMap.entries()) {
        let priority = -1;
        if (station.name === normalizedText) {
            priority = 0;
        } else if (station.name.startsWith(normalizedText)) {
            priority = 1;
        } else if (station.name.includes(normalizedText)) {
            priority = 2;
        }
        if (priority !== -1) {
            resultWithPriority.push({ station_cd, station, priority });
        }
    }
    resultWithPriority.sort((a, b) => a.priority - b.priority);
    return resultWithPriority.map(({ station_cd, station }) => ({ station_cd, station }));
};

export default function TransferGuidePage() {
    const [stationMap, setStationMap] = useState<Map<number, Station>>(new Map());
    const [lineMap, setLineMap] = useState<Map<number, string>>(new Map());
    const [groupMap, setGroupMap] = useState<Map<number, number[]>>(new Map());
    const [loading, setLoading] = useState(true);
    const [departureStationText, setDepartureStationText] = useState("");
    const [arrivalStationText, setArrivalStationText] = useState("");
    const [selectedDepartureCd, setSelectedDepartureCd] = useState<number | null>(null);
    const [selectedArrivalCd, setSelectedArrivalCd] = useState<number | null>(null);

    useEffect(() => {
        async function loadData() {
            const res = await fetch("/transfer-guide/ekidata_jp.json");
            const raw: RawData = await res.json();

            const sMap = new Map<number, Station>();
            const lMap = new Map<number, string>();
            const gMap = new Map<number, number[]>();

            for (const [line_cd_str, line_name] of Object.entries(raw.lines)) {
                const line_cd = parseInt(line_cd_str);
                lMap.set(line_cd, line_name);
            }
            for (const [station_cd_str, station_info] of Object.entries(raw.stations)) {
                const station_cd = parseInt(station_cd_str);
                sMap.set(station_cd, {
                    name: toFullWidth(station_info.n),
                    line_cd: station_info.l,
                    g_cd: station_info.g,
                    edges: station_info.e
                });
                if (!gMap.has(station_info.g)) {
                    gMap.set(station_info.g, []);
                }
                gMap.get(station_info.g)!.push(station_cd);
            }
            setStationMap(sMap);
            setLineMap(lMap);
            setGroupMap(gMap);
            setLoading(false);
        }
        loadData();
    }, []);

    const candidateDepartureStations = useMemo(() => {
        return filterStations(departureStationText, stationMap);
    }, [departureStationText, stationMap]);

    const candidateArrivalStations = useMemo(() => {
        return filterStations(arrivalStationText, stationMap);
    }, [arrivalStationText, stationMap]);

    const route: RouteResult = useMemo(() => {
        if (selectedDepartureCd === null || selectedArrivalCd === null) {
            return { type: "IDLE" };
        }
        const SIZE = stationMap.size; // 十分大きい値であればよい，こんなに大きくなくとも余裕ですが念の為
        const deque = new Array<{ cd: number, from: number }>(SIZE);
        let head = 0;
        let tail = 0;
        const visited = new Map<number, { from: number }>();

        const pushFront = (cd: number, from: number) => {
            head = (head - 1 + SIZE) % SIZE;
            deque[head] = { cd, from };
        }
        const pushBack = (cd: number, from: number) => {
            deque[tail] = { cd, from };
            tail = (tail + 1) % SIZE;
        }
        const popFront = () => {
            const val = deque[head];
            head = (head + 1) % SIZE;
            return val;
        }
        const isEmpty = () => head === tail;

        // 逆から 0-1 BFS
        pushFront(selectedArrivalCd, -1);

        while (!isEmpty()) {
            const { cd, from } = popFront();

            if (visited.has(cd)) {
                continue;
            }
            visited.set(cd, { from });
            if (cd === selectedDepartureCd) {
                break;
            }
            const currentStation = stationMap.get(cd)!;
            for (const nextCd of groupMap.get(currentStation.g_cd)!) {
                if (!visited.has(nextCd)) {
                    pushFront(nextCd, cd);
                }
            }
            for (const nextCd of currentStation.edges) {
                if (!visited.has(nextCd)) {
                    pushBack(nextCd, cd);
                }
            }
        }
        if (!visited.has(selectedDepartureCd)) {
            return { type: "NO_ROUTE" };
        }
        const path = [];
        let currentCd = selectedDepartureCd;
        while (currentCd !== -1) {
            if (path.length >= 2 && stationMap.get(path[path.length - 2])!.g_cd === stationMap.get(currentCd)!.g_cd) {
                path.pop(); // 2 つ前と同じグループなら、途中の駅は通過するだけなので経路から外す
            }
            path.push(currentCd);
            currentCd = visited.get(currentCd)!.from;
        }
        let cost = 0;
        for (let i = 1; i < path.length; i++) {
            const prevStation = stationMap.get(path[i - 1])!;
            const currentStation = stationMap.get(path[i])!;
            if (prevStation.g_cd !== currentStation.g_cd) {
                cost++;
            }
        }
        return { type: "SUCCESS", result: path, cost };
    }, [selectedArrivalCd, selectedDepartureCd, groupMap, stationMap]);

    return (
        <>
            <h1 className="title">乗換案内（最少通過区間）</h1>
            <div className="introduction">
                乗換案内です．最少通過区間でルートを検索します．<br />
                新幹線には対応していません．<br />
                開発記事は<Link href="/blog/transfer-guide">こちら</Link>から．<br />
                駅データは 2026 年 4 月 9 日時点のものを使用しています．
            </div>
            <div className="layout-container">
                <div className="input-container">
                    <div className="station-selector">
                        <span className="label">出発駅</span>
                        <div className="field-group">
                            <input
                                type="text"
                                className="station-input"
                                placeholder="出発駅を入力"
                                value={departureStationText}
                                onChange={
                                    (e) => {
                                        setDepartureStationText(e.target.value)
                                        setSelectedDepartureCd(null);
                                    }
                                }
                            />
                            <select
                                className="station-dropdown"
                                value={selectedDepartureCd ?? ""}
                                onChange={(e) => setSelectedDepartureCd(parseInt(e.target.value))}
                                disabled={candidateDepartureStations.length === 0}
                            >
                                <option value="" disabled>出発駅を選択してください</option>
                                {candidateDepartureStations.map(({ station_cd, station }) => (
                                    <option key={station_cd} value={station_cd}>
                                        {station.name} ({lineMap.get(station.line_cd)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="station-selector">
                        <span className="label">到着駅</span>
                        <div className="field-group">
                            <input
                                type="text"
                                className="station-input"
                                placeholder="到着駅を入力"
                                value={arrivalStationText}
                                onChange={
                                    (e) => {
                                        setArrivalStationText(e.target.value)
                                        setSelectedArrivalCd(null);
                                    }
                                }
                            />
                            <select className="station-dropdown"
                                value={selectedArrivalCd ?? ""}
                                onChange={(e) => setSelectedArrivalCd(parseInt(e.target.value))}
                                disabled={candidateArrivalStations.length === 0}
                            >
                                <option value="" disabled>到着駅を選択してください</option>
                                {candidateArrivalStations.map(({ station_cd, station }) => (
                                    <option key={station_cd} value={station_cd}>
                                        {station.name} ({lineMap.get(station.line_cd)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                {loading && <div className="loading">データを読み込んでいます...</div>}
                <div className="output-container">
                    {route.type === "IDLE" && <div className="idle-message">駅を選択してください</div>}
                    {route.type === "NO_ROUTE" && <div className="error-message">経路が見つかりません</div>}
                    {route.type === "SUCCESS" && (
                        <>
                            <div className="route-cost">通過区間：{route.cost} 区間</div>
                            <div className="route-result">
                                {route.result.map((station_cd, index) => {
                                    const station = stationMap.get(station_cd)!;
                                    const line_cd = station.line_cd;
                                    const lineName = lineMap.get(line_cd)!;
                                    if (index === 0) {
                                        return (
                                            <div key={station_cd} className="route-station">
                                                <span className="station-name">{station.name}</span>
                                                <span className="line-name">{lineName}</span>
                                            </div>
                                        )
                                    }
                                    const g_cd = station.g_cd;
                                    const prevStation = stationMap.get(route.result[index - 1])!;
                                    const prevg_cd = prevStation.g_cd;
                                    if (prevg_cd === g_cd) {
                                        return (
                                            <Fragment key={station_cd}>
                                                <div className="transfer">乗換</div>
                                                <div className="route-station">
                                                    <span className="station-name">{station.name}</span>
                                                    <span className="line-name">{lineName}</span>
                                                </div>
                                            </Fragment>
                                        )
                                    }
                                    else {
                                        return (
                                            <div key={station_cd} className="route-station">
                                                <span className="station-name">{station.name}</span>
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="license">
                このアプリでは，以下のデータセット・リソースを使用しています．
                <li>
                    <strong>駅データ.jp</strong><br />
                    <Link href="https://ekidata.jp/">駅データ.jp</Link> のデータを加工して使用しています．<br />
                </li>
            </div>
        </>
    )
}
