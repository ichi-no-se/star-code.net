"use client";
import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import "@styles/kaleidoscope.css";

export interface SquareConfig {
    cx: number;
    cy: number;
    r: number;
    angle: number;
}

interface Props {
    image: HTMLImageElement;
    config: SquareConfig;
    onChange: (config: SquareConfig, isDragging: boolean) => void;
}

export const calcPoints = (config: SquareConfig) => {
    const points = [];
    for (let i = 0; i < 4; i++) {
        const angle = config.angle + i * Math.PI / 2 + Math.PI / 4;
        const x = config.cx + config.r * Math.cos(angle);
        const y = config.cy + config.r * Math.sin(angle);
        points.push({ x, y });
    }
    return points;
}

export interface SquareSelectorRef {
    validateConfig: (config: SquareConfig) => boolean;
}

const SquareSelector = forwardRef<SquareSelectorRef, Props>(({ image, config, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"translate" | "rotate-scale">("translate");
    const [draggingPointIndex, setDraggingPointIndex] = useState<0 | 1 | 2 | 3>(0);
    const dragOffset = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const [hoverMode, setHoverMode] = useState<"none" | "translate" | "rotate-scale">("none");
    const lastNotifyTime = useRef(0);
    const HIT_RADIUS = Math.max(image.naturalWidth, image.naturalHeight) * 0.015;

    const notifyChange = (config: SquareConfig, isDragging: boolean) => {
        const now = Date.now();
        if (!isDragging || now - lastNotifyTime.current > 50) {
            onChange(config, isDragging);
            lastNotifyTime.current = now;
        }
    };

    useEffect(() => {
        const initialConfig = {
            cx: image.naturalWidth / 2,
            cy: image.naturalHeight / 2,
            r: Math.min(image.naturalWidth, image.naturalHeight) / 8,
            angle: 0
        }
        notifyChange(initialConfig, false);
    }, [image]);

    const isConfigValid = (config: SquareConfig, image: HTMLImageElement) => {
        if (config.r <= 2) return false; // 半径が小さすぎる場合無効
        const pointsFromConfig = calcPoints(config);
        for (const point of pointsFromConfig) {
            if (point.x < 0 || point.x > image.naturalWidth || point.y < 0 || point.y > image.naturalHeight) {
                return false;
            }
        }
        return true;
    }

    useImperativeHandle(ref, () => ({
        validateConfig: (config: SquareConfig) => {
            return isConfigValid(config, image);
        }
    }
    ))

    const points = useMemo(() => {
        return calcPoints(config);
    }, [config]);


    const isInsideSquare = (x: number, y: number) => {
        const dx = x - config.cx;
        const dy = y - config.cy;
        const cos = Math.cos(-config.angle);
        const sin = Math.sin(-config.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        return Math.abs(localX) <= config.r / Math.sqrt(2) && Math.abs(localY) <= config.r / Math.sqrt(2);
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        startDragging(e.clientX, e.clientY);
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.cancelable) {
            e.preventDefault();
        }
        const touch = e.touches[0];
        startDragging(touch.clientX, touch.clientY);
    }

    const startDragging = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const scaleX = image.naturalWidth / rect.width;
        const scaleY = image.naturalHeight / rect.height;
        const mouseX = (clientX - rect.left) * scaleX;
        const mouseY = (clientY - rect.top) * scaleY;
        let shortestDistance = Infinity;
        let closestPointIndex: 0 | 1 | 2 | 3 = 0;
        for (let i = 0; i < 4; i++) {
            const dx = points[i].x - mouseX;
            const dy = points[i].y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestPointIndex = i as 0 | 1 | 2 | 3;
            }
        }
        if (shortestDistance < HIT_RADIUS) {
            setDragMode("rotate-scale");
            setDraggingPointIndex(closestPointIndex);
            setIsDragging(true);
            dragOffset.current = { x: points[closestPointIndex].x - mouseX, y: points[closestPointIndex].y - mouseY };
        }
        else {
            setDragMode("translate");
            if (isInsideSquare(mouseX, mouseY)) {
                setIsDragging(true);
                dragOffset.current = { x: config.cx - mouseX, y: config.cy - mouseY };
            }
            else {
                setIsDragging(false);
            }
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        updateDragging(e.clientX, e.clientY);
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.cancelable) {
            e.preventDefault();
        }
        const touch = e.touches[0];
        updateDragging(touch.clientX, touch.clientY);
    }

    const updateDragging = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const scaleX = image.naturalWidth / rect.width;
        const scaleY = image.naturalHeight / rect.height;
        const mouseX = (clientX - rect.left) * scaleX;
        const mouseY = (clientY - rect.top) * scaleY;
        if (!isDragging) {
            let shortestDistance = Infinity;
            for (let i = 0; i < 4; i++) {
                const dx = points[i].x - mouseX;
                const dy = points[i].y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                }
            }
            if (shortestDistance < HIT_RADIUS) {
                setHoverMode("rotate-scale");
            }
            else {
                if (isInsideSquare(mouseX, mouseY)) {
                    setHoverMode("translate");
                }
                else {
                    setHoverMode("none");
                }
            }
            return;
        }
        const x = mouseX + dragOffset.current.x;
        const y = mouseY + dragOffset.current.y;

        if (dragMode === "translate") {
            const newConfig = { ...config, cx: x, cy: y };
            if (isConfigValid(newConfig, image)) {
                notifyChange(newConfig, true);
            }
        }
        else {
            const distance = Math.sqrt((x - config.cx) ** 2 + (y - config.cy) ** 2);
            const deltaAngle = Math.atan2(y - config.cy, x - config.cx) - Math.atan2(points[draggingPointIndex].y - config.cy, points[draggingPointIndex].x - config.cx);
            const newConfig = { ...config, r: distance, angle: config.angle + deltaAngle };
            if (isConfigValid(newConfig, image)) {
                notifyChange(newConfig, true);
            }
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false);
        setHoverMode("none");
        notifyChange(config, false);
    }

    const handleTouchEnd = () => {
        setIsDragging(false);
        setHoverMode("none");
        notifyChange(config, false);
    }

    return (
        <div ref={containerRef} className="shape-container" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} data-cursor={isDragging ? dragMode : hoverMode}>
            <img src={image.src} className="image" />
            <svg className="overlay" viewBox={`0 0 ${image.naturalWidth} ${image.naturalHeight}`}>
                <g className="selector-group">
                    <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} className="shape" />
                    {
                        points.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={HIT_RADIUS} className="handle" />
                        ))
                    }
                </g>
            </svg>
        </div>
    )
}
);

export default SquareSelector;
