"use client";

import Link from 'next/link';
import { useState, useMemo } from 'react'

type Route = string[];

interface BaseSpecialTicket {
    id: string;
    name: string;
    price: number;
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
    price: number;
    memo: string;
}

interface RouteSegmentResult {
    from: string;
    to: string;
    price: number;
    coveredBy: {
        kind: 'normal' | 'special-approach' | 'special-free';
        ticketName: string;
        memo: string;
    };
}

interface CalculatedRoute {
    segments: RouteSegmentResult[];
    totalPrice: number;
    usedSpecialTickets: SpecialTicket[];
}

export default function CheapestRoute() {
    const [route, setRoute] = useState<Route>(["", ""]);
    const [specialTickets, setSpecialTickets] = useState<SpecialTicket[]>([]);
    const [normalTickets, setNormalTickets] = useState<NormalTicket[]>([]);
    const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null);

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

    };

    return (
        <>
            <h1 className="title">最安値ルート計算ツール</h1>
            <h2 className="introduction">最安値ルートを計算するためのツールです．</h2>
            <datalist id="known-stations">
                {knownStations.map((station) => (
                    <option key={station} value={station} />
                ))}
            </datalist>
            <div className="route-input">
                <div className="route-label">ルート:</div>
                <div className="route-stations">
                    {route.map((station, index) => (
                        <div key={index} className="station-input">
                            <input type="text" list="known-stations" value={station} onChange={(e) => {
                                const newRoute = [...route];
                                newRoute[index] = e.target.value;
                                setRoute(newRoute);
                            }} />
                            {index < route.length - 1 && <span>→</span>}
                        </div>
                    ))}
                    <button className="add-station-button" onClick={() => {
                        setRoute([...route, ""]);
                    }}>+</button>
                    {route.length > 2 && <button className="remove-station-button" onClick={() => {
                        setRoute(route.slice(0, -1));
                    }}>-</button>}
                </div>
            </div>
            <div className="tickets-input">
                <span className="ticket-label">企画券</span>
                {/* 特別切符の入力フォームをここに追加 */}
            </div>
            <div className="tickets-input">
                <span className="ticket-label">通常切符</span>
                {/* 通常切符の入力フォームをここに追加 */}
            </div>
            <div className="calculate-button-container">
                <button onClick={calcRoute}>ルート計算</button>
            </div>
            <div className="calculated-route">
            </div>
        </>
    )
}