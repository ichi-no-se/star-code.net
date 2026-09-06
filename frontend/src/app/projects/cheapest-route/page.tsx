"use client";

import { useState, useMemo } from 'react'
import "@styles/cheapest-route.css"

type Route = string[];

interface BaseSpecialTicket {
    id: string;
    name: string;
    price: number | "";
    memo: string;
}

interface RoundTripTicket extends BaseSpecialTicket {
    type: 'roundTrip';
    approach: { from: string; to: string };
}

interface FreePassTicket extends BaseSpecialTicket {
    type: 'freePass';
    freeStations: string[];
}

interface HybridTicket extends BaseSpecialTicket {
    type: 'hybrid';
    approach: { from: string; to: string };
    freeStations: string[];
}

type SpecialTicket = RoundTripTicket | FreePassTicket | HybridTicket;

interface NormalTicket {
    id: string;
    from: string;
    to: string;
    direction: 'oneWay' | 'bidirectional';
    price: number | "";
    memo: string;
}

type PartialRouteSegmentNormal = {
    kind: 'normal';
    price: number;
};

type PartialRouteSegmentSpecial = {
    kind: 'special';
    ticketName: string;
};


type RouteSegment = {
    to: string;
    from: string;
    memo: string;
} & (PartialRouteSegmentNormal | PartialRouteSegmentSpecial);

interface CalculatedRoute {
    segments: RouteSegment[];
    totalPrice: number;
    usedSpecialTickets: SpecialTicket[];
}

export default function CheapestRoute() {
    const [route, setRoute] = useState<Route>(["", ""]);
    const [specialTickets, setSpecialTickets] = useState<SpecialTicket[]>([{ id: crypto.randomUUID(), name: "", price: "", memo: "", type: "freePass", freeStations: [""] }]);
    const [normalTickets, setNormalTickets] = useState<NormalTicket[]>([{ id: crypto.randomUUID(), from: "", to: "", direction: "bidirectional", price: "", memo: "" }]);
    const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null);
    const MAX_SPECIAL_TICKETS = 8;

    const knownStations = useMemo(() => {
        const stations = new Set<string>();
        route.forEach(station => stations.add(station.trim()));
        specialTickets.forEach(ticket => {
            if (ticket.type === 'roundTrip' || ticket.type === 'hybrid') {
                stations.add(ticket.approach.from.trim());
                stations.add(ticket.approach.to.trim());
            }
            if (ticket.type === 'freePass' || ticket.type === 'hybrid') {
                ticket.freeStations.forEach(station => stations.add(station.trim()));
            }
        });
        normalTickets.forEach(ticket => {
            stations.add(ticket.from.trim());
            stations.add(ticket.to.trim());
        });
        return Array.from(stations).filter(station => station !== "");
    }, [route, specialTickets, normalTickets]);

    const calcRoute = () => {
        const validSpecialTickets = structuredClone(specialTickets.filter(ticket => ticket.name.trim() !== "" && ticket.price !== "" && ticket.price >= 0));
        const validNormalTickets = structuredClone(normalTickets.filter(ticket => ticket.from.trim() !== "" && ticket.to.trim() !== "" && ticket.price !== "" && ticket.price >= 0));
        const cheapestRoute: CalculatedRoute = { segments: [], totalPrice: Infinity, usedSpecialTickets: [] };
        for (let i = 0; i < (1 << validSpecialTickets.length); i++) {
            const currentSpecialTickets: SpecialTicket[] = [];
            for (let j = 0; j < validSpecialTickets.length; j++) {
                if (i & (1 << j)) {
                    currentSpecialTickets.push(validSpecialTickets[j]);
                }
            }
            const approachTickets = currentSpecialTickets.filter(ticket => ticket.type === 'roundTrip' || ticket.type === 'hybrid');
            const freePassTickets = currentSpecialTickets.filter(ticket => ticket.type === 'freePass' || ticket.type === 'hybrid');

            const stateBits = approachTickets.length * 2;
            const numStates = 1 << stateBits;

            const stationSet = new Set<string>();
            route.forEach(station => stationSet.add(station.trim()));
            approachTickets.forEach(ticket => {
                stationSet.add(ticket.approach.from.trim());
                stationSet.add(ticket.approach.to.trim());
            });
            freePassTickets.forEach(ticket => {
                ticket.freeStations.forEach(station => stationSet.add(station.trim()));
            });
            validNormalTickets.forEach(ticket => {
                stationSet.add(ticket.from.trim());
                stationSet.add(ticket.to.trim());
            });
            const indexToStations = Array.from(stationSet);
            const stationToIndex = new Map<string, number>();
            indexToStations.forEach((station, index) => {
                stationToIndex.set(station, index);
            });

            let stationBits = 1;
            while ((1 << stationBits) < indexToStations.length) {
                stationBits++;
            }

            const toKey = (step: number, stationIndex: number, state: number) => {
                return (step << (stateBits + stationBits)) | (stationIndex << stateBits) | state;
            };

            const fromKey = (key: number) => {
                const state = key & ((1 << stateBits) - 1);
                const stationIndex = (key >> stateBits) & ((1 << stationBits) - 1);
                const step = key >> (stateBits + stationBits);
                return { step, stationIndex, state };
            };

            interface NormalEdge {
                to: number;
                price: number;
                memo: string;
            };

            const normalEdges: NormalEdge[][] = Array.from({ length: indexToStations.length }, () => []);

            validNormalTickets.forEach((ticket) => {
                const fromIndex = stationToIndex.get(ticket.from.trim());
                const toIndex = stationToIndex.get(ticket.to.trim());
                if (fromIndex === undefined || toIndex === undefined) {
                    return;
                }
                const edge: NormalEdge = {
                    to: toIndex,
                    price: ticket.price === "" ? 0 : ticket.price,
                    memo: ticket.memo
                };
                normalEdges[fromIndex].push(edge);
                if (ticket.direction === 'bidirectional') {
                    const reverseEdge: NormalEdge = {
                        to: fromIndex,
                        price: ticket.price === "" ? 0 : ticket.price,
                        memo: ticket.memo
                    };
                    normalEdges[toIndex].push(reverseEdge);
                }
            });

            interface FreeEdge {
                to: number;
                ticketName: string;
                memo: string;
            };

            const freeEdges: FreeEdge[][] = Array.from({ length: indexToStations.length }, () => []);

            freePassTickets.forEach((ticket) => {
                const freeStationIndices = ticket.freeStations.map(station => stationToIndex.get(station.trim())).filter(index => index !== undefined) as number[];
                for (let i = 0; i < freeStationIndices.length; i++) {
                    for (let j = 0; j < freeStationIndices.length; j++) {
                        if (i === j) continue;
                        const fromIndex = freeStationIndices[i];
                        const toIndex = freeStationIndices[j];
                        const edge: FreeEdge = {
                            to: toIndex,
                            ticketName: ticket.name + "（フリー区間）",
                            memo: ticket.memo
                        };
                        freeEdges[fromIndex].push(edge);
                    }
                }
            });

            interface ApproachEdge {
                to: number;
                ticketName: string;
                approachIndex: number;
                memo: string;
            };

            const approachEdges: ApproachEdge[][] = Array.from({ length: indexToStations.length }, () => []);

            approachTickets.forEach((ticket, index) => {
                const fromIndex = stationToIndex.get(ticket.approach.from.trim());
                const toIndex = stationToIndex.get(ticket.approach.to.trim());
                if (fromIndex === undefined || toIndex === undefined) {
                    return;
                }
                const outboundEdge: ApproachEdge = {
                    to: toIndex,
                    ticketName: ticket.name + "（往路）",
                    approachIndex: index * 2,
                    memo: ticket.memo
                };
                approachEdges[fromIndex].push(outboundEdge);
                const inboundEdge: ApproachEdge = {
                    to: fromIndex,
                    ticketName: ticket.name + "（復路）",
                    approachIndex: index * 2 + 1,
                    memo: ticket.memo
                };
                approachEdges[toIndex].push(inboundEdge);
            });

            const routeStationIndices = route.map(station => stationToIndex.get(station.trim())!);
            if (routeStationIndices.length < 2) {
                continue;
            }
            const nodes = new Map<number, { toralPrice: number, prevIndex: number | null, prevSegment: RouteSegment | null }>();
            const startKey = toKey(0, routeStationIndices[0]!, 0);
            nodes.set(startKey, { toralPrice: 0, prevIndex: null, prevSegment: null });
            const unconfermedKeys = new Set<number>();
            unconfermedKeys.add(startKey);
            while (unconfermedKeys.size > 0) {
                let minKey: number | null = null;
                let minPrice = Infinity;
                unconfermedKeys.forEach(key => {
                    const node = nodes.get(key);
                    if (node && node.toralPrice < minPrice) {
                        minPrice = node.toralPrice;
                        minKey = key;
                    }
                });
                if (minKey === null) {
                    break;
                }
                unconfermedKeys.delete(minKey);
                const { step, stationIndex, state } = fromKey(minKey);
                const price = minPrice;

                const tryRelax = (nextStep: number, nextStationIndex: number, nextState: number, nextPrice: number, segment: RouteSegment | null) => {
                    const nextKey = toKey(nextStep, nextStationIndex, nextState);
                    const nextNode = nodes.get(nextKey);
                    if (!nextNode || nextNode.toralPrice > nextPrice) {
                        nodes.set(nextKey, { toralPrice: nextPrice, prevIndex: minKey, prevSegment: segment });
                        unconfermedKeys.add(nextKey);
                    }
                };

                if (step >= routeStationIndices.length - 1) {
                    continue;
                }
                if (stationIndex === routeStationIndices[step + 1]) {
                    tryRelax(step + 1, stationIndex, state, price, null);
                }
                normalEdges[stationIndex].forEach(edge => {
                    const segment: RouteSegment = {
                        kind: 'normal',
                        from: indexToStations[stationIndex],
                        to: indexToStations[edge.to],
                        price: edge.price,
                        memo: edge.memo
                    };
                    tryRelax(step, edge.to, state, price + edge.price, segment);
                });
                freeEdges[stationIndex].forEach(edge => {
                    const segment: RouteSegment = {
                        kind: 'special',
                        from: indexToStations[stationIndex],
                        to: indexToStations[edge.to],
                        ticketName: edge.ticketName,
                        memo: edge.memo
                    };
                    tryRelax(step, edge.to, state, price, segment);
                });
                approachEdges[stationIndex].forEach(edge => {
                    const bit = 1 << edge.approachIndex;
                    if ((state & bit) === 0) {
                        const segment: RouteSegment = {
                            kind: 'special',
                            from: indexToStations[stationIndex],
                            to: indexToStations[edge.to],
                            ticketName: edge.ticketName,
                            memo: edge.memo
                        };
                        tryRelax(step, edge.to, state | bit, price, segment);
                    }
                });
            }
            const goalStep = routeStationIndices.length - 1;
            const goalStation = routeStationIndices[goalStep]!;
            let endNode: { toralPrice: number; prevIndex: number | null; prevSegment: RouteSegment | null } | null = null;
            let bestGoalKey: number | null = null;
            let minEndPrice = Infinity;

            for (let s = 0; s < numStates; s++) {
                const endKey = toKey(goalStep, goalStation, s);
                const node = nodes.get(endKey);
                if (node && node.toralPrice < minEndPrice) {
                    minEndPrice = node.toralPrice;
                    endNode = node;
                    bestGoalKey = endKey;
                }
            }

            let specialTicketsPrice = 0;
            currentSpecialTickets.forEach(ticket => {
                specialTicketsPrice += ticket.price === "" ? 0 : ticket.price;
            });
            const totalPrice = (endNode?.toralPrice || 0) + specialTicketsPrice;

            if (endNode && totalPrice < cheapestRoute.totalPrice) {
                cheapestRoute.totalPrice = totalPrice;
                const reverseSegments: RouteSegment[] = [];
                let currentKey: number | null = bestGoalKey;
                while (currentKey !== null) {
                    const node = nodes.get(currentKey);
                    if (node && node.prevSegment) {
                        reverseSegments.push(node.prevSegment);
                    }
                    currentKey = node?.prevIndex || null;
                }
                cheapestRoute.segments = reverseSegments.reverse();
                cheapestRoute.usedSpecialTickets = currentSpecialTickets;
            }
        }
        setCalculatedRoute(cheapestRoute.totalPrice === Infinity ? null : cheapestRoute);
    };

    return (
        <>
            <h1 className="title">最安値ルート計算ツール</h1>
            <h2 className="introduction">最安値ルートを計算するためのツール．</h2>
            <datalist id="known-stations">
                {knownStations.map((station) => (
                    <option key={station} value={station} />
                ))}
            </datalist>
            <div className="route-input">
                <div className="route-label">ルート</div>
                <div className="route-stations">
                    <div className="stations-input-container">
                        {route.map((station, index) => (
                            <div key={index} className="station-input">
                                <input type="text" className="station-input-field" list="known-stations" placeholder="駅名" value={station} onChange={(e) => {
                                    const newRoute = [...route];
                                    newRoute[index] = e.target.value;
                                    setRoute(newRoute);
                                }} />
                                {index < route.length - 1 && <span className="route-separator">→</span>}
                            </div>
                        ))}
                    </div>
                    <div className="route-stations-buttons">
                        <button type="button" className="add-station-button"
                            onClick={() => {
                                setRoute([...route, ""]);
                            }}>追加</button>
                        <button type="button" className="remove-station-button"
                            onClick={() => {
                                setRoute(route.slice(0, -1));
                            }}
                            disabled={route.length <= 2}
                        >削除</button>
                    </div>
                </div>
            </div>
            {calculatedRoute && (
                <div className="calculated-route">
                    <span className="route-label">計算結果</span>
                    <div className="route-total-price">合計運賃：{calculatedRoute.totalPrice}円</div>
                    <div className="route-used-special-tickets">
                        <span className="used-tickets-label">使用した企画券</span>
                        {calculatedRoute.usedSpecialTickets.length > 0 ? (
                            <ul className="used-tickets-list">
                                {calculatedRoute.usedSpecialTickets.map((ticket, index) => (
                                    <li key={index} className="used-ticket-item"><span className="used-ticket-name">{ticket.name}</span>
                                        <span className="used-ticket-price">{ticket.price.toLocaleString()}円</span>
                                        {ticket.memo && <span className="used-ticket-memo">({ticket.memo})</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="no-tickets">なし</span>
                        )}
                    </div>
                    <div className="route-segments">
                        {calculatedRoute.segments.map((segment, index) => (
                            <div key={index} className="route-segment">
                                <span className="segment-station-from">{segment.from}</span>
                                <span className="segment-arrow">→</span>
                                <span className="segment-station-to">{segment.to}</span>
                                <div className="segment-ticket-info">
                                    <span className="segment-ticket-name">
                                        {segment.kind === 'normal' ? '通常切符' : segment.ticketName}
                                    </span>
                                    {segment.memo && <span className="segment-memo">({segment.memo})</span>}
                                </div>
                                <span className="segment-price">
                                    {segment.kind === 'normal' ? `${segment.price.toLocaleString()}円` : '0円'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }
            <div className="calculate-button-container">
                <button
                    className="calculate-button"
                    type="button"
                    onClick={calcRoute}
                    disabled={route.length < 2 || route.some(station => station.trim() === "")}
                >ルート計算</button>
            </div>
            <div className="tickets-input">
                <span className="ticket-label">企画券</span>
                <div className="special-ticket-list">
                    {specialTickets.map((ticket, index) => (
                        <div key={ticket.id} className="special-ticket-item">
                            <div className="special-ticket-main-row">
                                <select
                                    className="ticket-type-select"
                                    value={ticket.type} onChange={(e) => {
                                        const newTickets = [...specialTickets];
                                        const newType = e.target.value as SpecialTicket['type'];
                                        const currentApproach = 'approach' in ticket ? ticket.approach : { from: "", to: "" };
                                        const currentFreeStations = 'freeStations' in ticket ? ticket.freeStations : [""];
                                        if (newType === 'roundTrip') {
                                            newTickets[index] = { id: ticket.id, name: ticket.name, price: ticket.price, memo: ticket.memo, type: 'roundTrip', approach: currentApproach };
                                        } else if (newType === 'freePass') {
                                            newTickets[index] = { id: ticket.id, name: ticket.name, price: ticket.price, memo: ticket.memo, type: 'freePass', freeStations: currentFreeStations };
                                        } else if (newType === 'hybrid') {
                                            newTickets[index] = { id: ticket.id, name: ticket.name, price: ticket.price, memo: ticket.memo, type: 'hybrid', approach: currentApproach, freeStations: currentFreeStations };
                                        }
                                        setSpecialTickets(newTickets);
                                    }}>
                                    <option value="freePass">フリー切符</option>
                                    <option value="roundTrip">往復切符</option>
                                    <option value="hybrid">往復 + フリー</option>
                                </select>
                                <input type="text" className="ticket-name-input-field" placeholder="切符名" value={ticket.name} onChange={(e) => {
                                    const newTickets = [...specialTickets];
                                    newTickets[index].name = e.target.value;
                                    setSpecialTickets(newTickets);
                                }} />
                                <input type="number" className="price-input-field" placeholder="運賃" value={ticket.price}
                                    onChange={(e) => {
                                        const newTickets = [...specialTickets];
                                        newTickets[index].price = e.target.value == "" ? "" : Math.max(parseInt(e.target.value) || 0, 0);
                                        setSpecialTickets(newTickets);
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "") {
                                            const newTickets = [...specialTickets];
                                            newTickets[index].price = 0;
                                            setSpecialTickets(newTickets);
                                        }
                                    }}
                                />
                                <input type="text" className="memo-input-field" placeholder="備考" value={ticket.memo} onChange={(e) => {
                                    const newTickets = [...specialTickets];
                                    newTickets[index].memo = e.target.value;
                                    setSpecialTickets(newTickets);
                                }} />
                                <button
                                    type="button"
                                    className="remove-ticket-button"
                                    onClick={() => {
                                        setSpecialTickets(specialTickets.filter((_, i) => i !== index));
                                    }}
                                    disabled={specialTickets.length <= 1}
                                >
                                    削除
                                </button>
                            </div>
                            {ticket.type === 'roundTrip' || ticket.type === 'hybrid' ? (
                                <div className="special-ticket-approach">
                                    <span className="special-ticket-label">往復</span>
                                    <div className="special-ticket-approach-row">
                                        <input type="text" className="station-input-field" list="known-stations" placeholder="発駅" value={ticket.approach.from} onChange={(e) => {
                                            const newTickets = [...specialTickets];
                                            if ('approach' in newTickets[index]) {
                                                newTickets[index].approach.from = e.target.value;
                                            }
                                            setSpecialTickets(newTickets);
                                        }} />
                                        <span>⇔</span>
                                        <input type="text" className="station-input-field" list="known-stations" placeholder="着駅" value={ticket.approach.to} onChange={(e) => {
                                            const newTickets = [...specialTickets];
                                            if ('approach' in newTickets[index]) {
                                                newTickets[index].approach.to = e.target.value;
                                            }
                                            setSpecialTickets(newTickets);
                                        }} />
                                    </div>
                                </div>
                            ) : null}
                            {ticket.type === 'freePass' || ticket.type === 'hybrid' ? (
                                <div className="special-ticket-free-stations">
                                    <span className="special-ticket-label">フリー駅</span>
                                    <div className="free-station-list">
                                        {ticket.freeStations.map((station, stationIndex) => (
                                            <div key={stationIndex} className="free-station-input">
                                                <input
                                                    type="text"
                                                    className="station-input-field"
                                                    list="known-stations"
                                                    placeholder="駅名"
                                                    value={station}
                                                    onChange={(e) => {
                                                        const newTickets = [...specialTickets];
                                                        if ('freeStations' in newTickets[index]) {
                                                            newTickets[index].freeStations[stationIndex] = e.target.value;
                                                        }
                                                        setSpecialTickets(newTickets);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="free-station-buttons">
                                        <button
                                            type="button"
                                            className="add-free-station-button"
                                            onClick={() => {
                                                const newTickets = [...specialTickets];
                                                if ('freeStations' in newTickets[index]) {
                                                    newTickets[index].freeStations.push("");
                                                }
                                                setSpecialTickets(newTickets);
                                            }}
                                        >
                                            追加
                                        </button>
                                        <button
                                            type="button"
                                            className="remove-free-station-button"
                                            onClick={() => {
                                                const newTickets = [...specialTickets];
                                                if ('freeStations' in newTickets[index]) {
                                                    newTickets[index].freeStations.pop();
                                                }
                                                setSpecialTickets(newTickets);
                                            }}
                                            disabled={ticket.freeStations.length <= 1}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ))}<button type="button" className="add-ticket-button"
                        onClick={() => {
                            if (specialTickets.length >= MAX_SPECIAL_TICKETS) return;
                            setSpecialTickets([...specialTickets, { id: crypto.randomUUID(), name: "", price: "", memo: "", type: "freePass", freeStations: [] }]);
                        }}
                        disabled={specialTickets.length >= MAX_SPECIAL_TICKETS}
                    >追加</button>
                </div>
            </div>
            <div className="tickets-input">
                <span className="ticket-label">通常切符</span>
                <div className="normal-ticket-list">
                    {normalTickets.map((ticket, index) => (
                        <div key={ticket.id} className="normal-ticket-item">
                            <input type="text" className="station-input-field" placeholder="発駅" list="known-stations" value={ticket.from} onChange={(e) => {
                                const newTickets = [...normalTickets];
                                newTickets[index].from = e.target.value;
                                setNormalTickets(newTickets);
                            }} />
                            <button
                                type="button"
                                className="direction-toggle-button"
                                title={ticket.direction === 'bidirectional' ? 'クリックで片道に切替' : 'クリックで双方向に切替'}
                                onClick={() => {
                                    const updated = [...normalTickets];
                                    updated[index] = {
                                        ...ticket,
                                        direction: ticket.direction === 'bidirectional' ? 'oneWay' : 'bidirectional',
                                    };
                                    setNormalTickets(updated);
                                }}
                            >
                                {ticket.direction === 'bidirectional' ? '⇔' : '⇒'}
                            </button>
                            <input type="text" className="station-input-field" placeholder="着駅" list="known-stations" value={ticket.to} onChange={(e) => {
                                const newTickets = [...normalTickets];
                                newTickets[index].to = e.target.value;
                                setNormalTickets(newTickets);
                            }} />
                            <input type="number" className="price-input-field" placeholder="運賃" value={ticket.price}
                                onChange={(e) => {
                                    const newTickets = [...normalTickets];
                                    newTickets[index].price = e.target.value === "" ? "" : Math.max(parseInt(e.target.value) || 0, 0);
                                    setNormalTickets(newTickets);
                                }}
                                onBlur={(e) => {
                                    const newTickets = [...normalTickets];
                                    if (e.target.value === "") {
                                        newTickets[index].price = 0;
                                        setNormalTickets(newTickets);
                                    }
                                }} />
                            <input type="text" className="memo-input-field" placeholder="備考" value={ticket.memo} onChange={(e) => {
                                const newTickets = [...normalTickets];
                                newTickets[index].memo = e.target.value;
                                setNormalTickets(newTickets);
                            }} />
                            <button
                                type="button"
                                className="remove-ticket-button"
                                onClick={() => {
                                    setNormalTickets(normalTickets.filter((_, i) => i !== index));
                                }}
                                disabled={normalTickets.length <= 1}
                            >
                                削除
                            </button>
                        </div>
                    ))}
                    <button type="button" className="add-ticket-button"
                        onClick={() => {
                            setNormalTickets([...normalTickets, { id: crypto.randomUUID(), from: "", to: "", direction: "bidirectional", price: "", memo: "" }]);
                        }}
                    >追加</button>
                </div>
            </div>
        </>
    )
}