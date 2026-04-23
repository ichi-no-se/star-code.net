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
    const [route, setRoute] = useState<RouteResult>({ type: "IDLE" });

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

    useEffect(() => {
        if (selectedDepartureCd === null || selectedArrivalCd === null) {
            setRoute({ type: "IDLE" });
            return;
        }
        const SIZE = stationMap.size; // 十分大きい値であればよい，こんなに大きくなくとも余裕ですが念の為
        const deque = new Array<{ cd: number, val: number }>(SIZE);
        let head = 0;
        let tail = 0;

        const pushFront = (cd: number, val: number) => {
            head = (head - 1 + SIZE) % SIZE;
            deque[head] = { cd, val };
        }
        const pushBack = (cd: number, val: number) => {
            deque[tail] = { cd, val };
            tail = (tail + 1) % SIZE;
        }
        const popFront = () => {
            const val = deque[head];
            head = (head + 1) % SIZE;
            return val;
        }
        const clear = () => {
            head = 0;
            tail = 0;
        }
        const isEmpty = () => head === tail;

        // 前から 01 BFS
        pushFront(selectedDepartureCd, 0);
        const distMap = new Map<number, number>();
        while (!isEmpty()) {
            const { cd, val: dist } = popFront();
            if (distMap.has(cd)) {
                continue;
            }
            distMap.set(cd, dist);
            if (cd === selectedArrivalCd) {
                break;
            }
            const currentStation = stationMap.get(cd)!;
            for (const nextCd of groupMap.get(currentStation.g_cd)!) {
                pushFront(nextCd, dist);
            }
            for (const nextCd of currentStation.edges) {
                pushBack(nextCd, dist + 1);
            }
        }
        if (!distMap.has(selectedArrivalCd)) {
            setRoute({ type: "NO_ROUTE" });
            return;
        }

        // 乗り換え回数でもう一度 01 BFS（後ろから）
        clear();
        pushFront(selectedArrivalCd, -1);
        const visitedMap = new Map<number, number>(); // cd -> from
        while (!isEmpty()) {
            const { cd, val: from } = popFront();
            if (visitedMap.has(cd)) {
                continue;
            }
            visitedMap.set(cd, from);
            if (cd === selectedDepartureCd) {
                break;
            }
            const currentStation = stationMap.get(cd)!;
            const dist = distMap.get(cd)!;
            for (const nextCd of groupMap.get(currentStation.g_cd)!) {
                if (distMap.has(nextCd) && distMap.get(nextCd) === dist) {
                    pushBack(nextCd, cd);
                }
            }
            for (const nextCd of currentStation.edges) {
                if (distMap.has(nextCd) && distMap.get(nextCd) === dist - 1) {
                    pushFront(nextCd, cd);
                }
            }
        }

        const path = [];
        let currentCd = selectedDepartureCd;
        while (currentCd !== -1) {
            path.push(currentCd);
            currentCd = visitedMap.get(currentCd)!;
        }
        let cost = 0;
        for (let i = 1; i < path.length; i++) {
            const prevStation = stationMap.get(path[i - 1])!;
            const currentStation = stationMap.get(path[i])!;
            if (prevStation.g_cd !== currentStation.g_cd) {
                cost++;
            }
        }
        setRoute({ type: "SUCCESS", result: path, cost });
    }, [selectedArrivalCd, selectedDepartureCd, groupMap, stationMap]);

    return (
        <>
            <h1 className="title">乗換案内（最少通過区間）</h1>
            <div className="introduction">
                乗換案内です．最少通過区間の経路を算出します．<br />
                利便性，経済性は考慮していません．これらを考慮したい場合は<Link href="https://transit.yahoo.co.jp">こちら</Link>をご利用ください．<br />
                また，新幹線には対応していません．<br />
                開発記事は<Link href="/blog/transfer-guide">こちら</Link>から．<br />
                <small>このアプリでは，<Link href="https://ekidata.jp/">駅データ.jp</Link> のデータ（2026-04-09）を加工して使用しています．</small>
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
                            <div className="route-result" key={`${selectedDepartureCd}-${selectedArrivalCd}`}>
                                {route.result.map((station_cd, index) => {
                                    const station = stationMap.get(station_cd)!;
                                    const line_cd = station.line_cd;
                                    const lineName = lineMap.get(line_cd)!;
                                    const key_name = `${selectedDepartureCd}-${selectedArrivalCd}-${index}`;
                                    if (index === 0) {
                                        return (
                                            <div key={key_name} className="route-station">
                                                <span className="station-name">{station.name}</span>
                                                <span className="line-name">{lineName}</span>
                                            </div>
                                        )
                                    }
                                    const g_cd = station.g_cd;
                                    const prevStation = stationMap.get(route.result[index - 1])!;
                                    const prev_g_cd = prevStation.g_cd;
                                    if (prev_g_cd === g_cd) {
                                        return (
                                            <Fragment key={key_name}>
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
                                            <div key={key_name} className="route-station">
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
        </>
    )
}
