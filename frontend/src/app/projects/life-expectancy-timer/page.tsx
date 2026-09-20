"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import "@styles/life-expectancy-timer.css";

interface LifeExpectancyData {
    age: number;
    expectancy: number;
}

const DAYS_PER_YEAR = 365.2425;

const lifeExpectancyMaleData: LifeExpectancyData[] = [
    { age: 0, expectancy: 81.56 },
    { age: 7 / DAYS_PER_YEAR, expectancy: 81.60 },
    { age: 14 / DAYS_PER_YEAR, expectancy: 81.58 },
    { age: 21 / DAYS_PER_YEAR, expectancy: 81.57 },
    { age: 28 / DAYS_PER_YEAR, expectancy: 81.55 },
    { age: 2 / 12, expectancy: 81.48 },
    { age: 3 / 12, expectancy: 81.41 },
    { age: 6 / 12, expectancy: 81.18 },
    { age: 1, expectancy: 80.71 },
    { age: 2, expectancy: 79.73 },
    { age: 3, expectancy: 78.74 },
    { age: 4, expectancy: 77.75 },
    { age: 5, expectancy: 76.76 },
    { age: 6, expectancy: 75.76 },
    { age: 7, expectancy: 74.77 },
    { age: 8, expectancy: 73.77 },
    { age: 9, expectancy: 72.78 },
    { age: 10, expectancy: 71.78 },
    { age: 11, expectancy: 70.78 },
    { age: 12, expectancy: 69.79 },
    { age: 13, expectancy: 68.79 },
    { age: 14, expectancy: 67.80 },
    { age: 15, expectancy: 66.81 },
    { age: 16, expectancy: 65.82 },
    { age: 17, expectancy: 64.84 },
    { age: 18, expectancy: 63.86 },
    { age: 19, expectancy: 62.88 },
    { age: 20, expectancy: 61.90 },
    { age: 21, expectancy: 60.93 },
    { age: 22, expectancy: 59.96 },
    { age: 23, expectancy: 58.99 },
    { age: 24, expectancy: 58.02 },
    { age: 25, expectancy: 57.05 },
    { age: 26, expectancy: 56.08 },
    { age: 27, expectancy: 55.10 },
    { age: 28, expectancy: 54.13 },
    { age: 29, expectancy: 53.16 },
    { age: 30, expectancy: 52.18 },
    { age: 31, expectancy: 51.21 },
    { age: 32, expectancy: 50.24 },
    { age: 33, expectancy: 49.27 },
    { age: 34, expectancy: 48.30 },
    { age: 35, expectancy: 47.33 },
    { age: 36, expectancy: 46.36 },
    { age: 37, expectancy: 45.40 },
    { age: 38, expectancy: 44.43 },
    { age: 39, expectancy: 43.46 },
    { age: 40, expectancy: 42.50 },
    { age: 41, expectancy: 41.54 },
    { age: 42, expectancy: 40.58 },
    { age: 43, expectancy: 39.62 },
    { age: 44, expectancy: 38.67 },
    { age: 45, expectancy: 37.72 },
    { age: 46, expectancy: 36.78 },
    { age: 47, expectancy: 35.84 },
    { age: 48, expectancy: 34.90 },
    { age: 49, expectancy: 33.97 },
    { age: 50, expectancy: 33.04 },
    { age: 51, expectancy: 32.12 },
    { age: 52, expectancy: 31.21 },
    { age: 53, expectancy: 30.30 },
    { age: 54, expectancy: 29.40 },
    { age: 55, expectancy: 28.50 },
    { age: 56, expectancy: 27.61 },
    { age: 57, expectancy: 26.73 },
    { age: 58, expectancy: 25.85 },
    { age: 59, expectancy: 24.98 },
    { age: 60, expectancy: 24.12 },
    { age: 61, expectancy: 23.27 },
    { age: 62, expectancy: 22.43 },
    { age: 63, expectancy: 21.60 },
    { age: 64, expectancy: 20.78 },
    { age: 65, expectancy: 19.97 },
    { age: 66, expectancy: 19.16 },
    { age: 67, expectancy: 18.37 },
    { age: 68, expectancy: 17.60 },
    { age: 69, expectancy: 16.84 },
    { age: 70, expectancy: 16.09 },
    { age: 71, expectancy: 15.36 },
    { age: 72, expectancy: 14.63 },
    { age: 73, expectancy: 13.92 },
    { age: 74, expectancy: 13.23 },
    { age: 75, expectancy: 12.54 },
    { age: 76, expectancy: 11.87 },
    { age: 77, expectancy: 11.22 },
    { age: 78, expectancy: 10.58 },
    { age: 79, expectancy: 9.95 },
    { age: 80, expectancy: 9.34 },
    { age: 81, expectancy: 8.74 },
    { age: 82, expectancy: 8.17 },
    { age: 83, expectancy: 7.62 },
    { age: 84, expectancy: 7.09 },
    { age: 85, expectancy: 6.59 },
    { age: 86, expectancy: 6.11 },
    { age: 87, expectancy: 5.66 },
    { age: 88, expectancy: 5.24 },
    { age: 89, expectancy: 4.85 },
    { age: 90, expectancy: 4.49 },
    { age: 91, expectancy: 4.15 },
    { age: 92, expectancy: 3.83 },
    { age: 93, expectancy: 3.55 },
    { age: 94, expectancy: 3.29 },
    { age: 95, expectancy: 3.06 },
    { age: 96, expectancy: 2.86 },
    { age: 97, expectancy: 2.68 },
    { age: 98, expectancy: 2.51 },
    { age: 99, expectancy: 2.35 },
    { age: 100, expectancy: 2.21 },
    { age: 101, expectancy: 2.07 },
    { age: 102, expectancy: 1.95 },
    { age: 103, expectancy: 1.83 },
    { age: 104, expectancy: 1.73 },
    { age: 105, expectancy: 1.63 },
    { age: 106, expectancy: 1.54 },
    { age: 107, expectancy: 1.45 },
    { age: 108, expectancy: 1.37 },
    { age: 109, expectancy: 1.30 },
    { age: 110, expectancy: 1.23 },
    { age: 111, expectancy: 1.16 },
    { age: 112, expectancy: 1.10 },
    { age: 113, expectancy: 1.05 }
];

const lifeExpectancyFemaleData: LifeExpectancyData[] = [
    { age: 0, expectancy: 87.71 },
    { age: 7 / DAYS_PER_YEAR, expectancy: 87.75 },
    { age: 14 / DAYS_PER_YEAR, expectancy: 87.74 },
    { age: 21 / DAYS_PER_YEAR, expectancy: 87.72 },
    { age: 28 / DAYS_PER_YEAR, expectancy: 87.71 },
    { age: 2 / 12, expectancy: 87.63 },
    { age: 3 / 12, expectancy: 87.56 },
    { age: 6 / 12, expectancy: 87.33 },
    { age: 1, expectancy: 86.86 },
    { age: 2, expectancy: 85.88 },
    { age: 3, expectancy: 84.89 },
    { age: 4, expectancy: 83.90 },
    { age: 5, expectancy: 82.90 },
    { age: 6, expectancy: 81.91 },
    { age: 7, expectancy: 80.91 },
    { age: 8, expectancy: 79.92 },
    { age: 9, expectancy: 78.92 },
    { age: 10, expectancy: 77.93 },
    { age: 11, expectancy: 76.93 },
    { age: 12, expectancy: 75.93 },
    { age: 13, expectancy: 74.94 },
    { age: 14, expectancy: 73.95 },
    { age: 15, expectancy: 72.95 },
    { age: 16, expectancy: 71.96 },
    { age: 17, expectancy: 70.97 },
    { age: 18, expectancy: 69.98 },
    { age: 19, expectancy: 69.00 },
    { age: 20, expectancy: 68.01 },
    { age: 21, expectancy: 67.02 },
    { age: 22, expectancy: 66.04 },
    { age: 23, expectancy: 65.06 },
    { age: 24, expectancy: 64.07 },
    { age: 25, expectancy: 63.09 },
    { age: 26, expectancy: 62.10 },
    { age: 27, expectancy: 61.12 },
    { age: 28, expectancy: 60.13 },
    { age: 29, expectancy: 59.15 },
    { age: 30, expectancy: 58.17 },
    { age: 31, expectancy: 57.18 },
    { age: 32, expectancy: 56.20 },
    { age: 33, expectancy: 55.21 },
    { age: 34, expectancy: 54.23 },
    { age: 35, expectancy: 53.25 },
    { age: 36, expectancy: 52.27 },
    { age: 37, expectancy: 51.29 },
    { age: 38, expectancy: 50.31 },
    { age: 39, expectancy: 49.34 },
    { age: 40, expectancy: 48.37 },
    { age: 41, expectancy: 47.39 },
    { age: 42, expectancy: 46.42 },
    { age: 43, expectancy: 45.45 },
    { age: 44, expectancy: 44.49 },
    { age: 45, expectancy: 43.52 },
    { age: 46, expectancy: 42.56 },
    { age: 47, expectancy: 41.60 },
    { age: 48, expectancy: 40.65 },
    { age: 49, expectancy: 39.70 },
    { age: 50, expectancy: 38.75 },
    { age: 51, expectancy: 37.80 },
    { age: 52, expectancy: 36.86 },
    { age: 53, expectancy: 35.92 },
    { age: 54, expectancy: 34.99 },
    { age: 55, expectancy: 34.06 },
    { age: 56, expectancy: 33.12 },
    { age: 57, expectancy: 32.19 },
    { age: 58, expectancy: 31.27 },
    { age: 59, expectancy: 30.35 },
    { age: 60, expectancy: 29.42 },
    { age: 61, expectancy: 28.51 },
    { age: 62, expectancy: 27.59 },
    { age: 63, expectancy: 26.68 },
    { age: 64, expectancy: 25.78 },
    { age: 65, expectancy: 24.88 },
    { age: 66, expectancy: 23.98 },
    { age: 67, expectancy: 23.09 },
    { age: 68, expectancy: 22.20 },
    { age: 69, expectancy: 21.32 },
    { age: 70, expectancy: 20.45 },
    { age: 71, expectancy: 19.59 },
    { age: 72, expectancy: 18.73 },
    { age: 73, expectancy: 17.89 },
    { age: 74, expectancy: 17.05 },
    { age: 75, expectancy: 16.22 },
    { age: 76, expectancy: 15.40 },
    { age: 77, expectancy: 14.59 },
    { age: 78, expectancy: 13.79 },
    { age: 79, expectancy: 13.01 },
    { age: 80, expectancy: 12.25 },
    { age: 81, expectancy: 11.50 },
    { age: 82, expectancy: 10.77 },
    { age: 83, expectancy: 10.07 },
    { age: 84, expectancy: 9.38 },
    { age: 85, expectancy: 8.73 },
    { age: 86, expectancy: 8.10 },
    { age: 87, expectancy: 7.49 },
    { age: 88, expectancy: 6.91 },
    { age: 89, expectancy: 6.37 },
    { age: 90, expectancy: 5.85 },
    { age: 91, expectancy: 5.37 },
    { age: 92, expectancy: 4.92 },
    { age: 93, expectancy: 4.50 },
    { age: 94, expectancy: 4.12 },
    { age: 95, expectancy: 3.78 },
    { age: 96, expectancy: 3.48 },
    { age: 97, expectancy: 3.21 },
    { age: 98, expectancy: 2.96 },
    { age: 99, expectancy: 2.73 },
    { age: 100, expectancy: 2.53 },
    { age: 101, expectancy: 2.34 },
    { age: 102, expectancy: 2.17 },
    { age: 103, expectancy: 2.01 },
    { age: 104, expectancy: 1.86 },
    { age: 105, expectancy: 1.73 },
    { age: 106, expectancy: 1.61 },
    { age: 107, expectancy: 1.50 },
    { age: 108, expectancy: 1.39 },
    { age: 109, expectancy: 1.30 },
    { age: 110, expectancy: 1.21 },
    { age: 111, expectancy: 1.13 },
    { age: 112, expectancy: 1.05 },
    { age: 113, expectancy: 0.98 },
    { age: 114, expectancy: 0.92 }
]

export default function LifeExpectancyTimer() {
    const [birthYear, setBirthYear] = useState<number>(2002);
    const [birthMonth, setBirthMonth] = useState<number>(4);
    const [birthDay, setBirthDay] = useState<number>(7);
    const [gender, setGender] = useState<"male" | "female">("male");
    const [viewMode, setViewMode] = useState<"years" | "days" | "hours" | "minutes" | "seconds">("years");

    const [currentTime, setCurrentTime] = useState<number | null>(null);

    useEffect(() => {
        setCurrentTime(Date.now());
        const intervalId = setInterval(() => {
            setCurrentTime(Date.now());
        }, 50);
        return () => clearInterval(intervalId);
    }, []);

    const calculateCurrentAge = (year: number, month: number, day: number, nowMs: number): number => {
        const birthDate = new Date(year, month - 1, day);
        const ageInMilliseconds = nowMs - birthDate.getTime();
        const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * DAYS_PER_YEAR);
        return ageInYears;
    };

    const getInterpolatedExpectancy = (age: number, gender: "male" | "female"): number => {
        const data = gender === "male" ? lifeExpectancyMaleData : lifeExpectancyFemaleData;
        if (age < 0) return data[0].expectancy - age;
        if (age >= data[data.length - 1].age) return 0;

        for (let i = 0; i < data.length - 1; i++) {
            if (age >= data[i].age && age < data[i + 1].age) {
                const ageDiff = data[i + 1].age - data[i].age;
                const expectancyDiff = data[i + 1].expectancy - data[i].expectancy;
                const ageFraction = (age - data[i].age) / ageDiff;
                return data[i].expectancy + expectancyDiff * ageFraction;
            }
        }
        return 0; // Fallback, should not reach here
    };

    const changeViewMode = () => {
        const modes: ("years" | "days" | "hours" | "minutes" | "seconds")[] = ["years", "days", "hours", "minutes", "seconds"];
        const currentIndex = modes.indexOf(viewMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setViewMode(modes[nextIndex]);
    };

    const getDaysInMonth = (year: number, month: number): number => {
        return new Date(year, month, 0).getDate();
    };

    const isValidDate = (year: number, month: number, day: number): boolean => {
        if (month < 1 || month > 12) return false;
        const daysInMonth = getDaysInMonth(year, month);
        return day >= 1 && day <= daysInMonth;
    };

    const handleMonthChange = (newMonth: number) => {
        const daysInNewMonth = getDaysInMonth(birthYear, newMonth);
        if (birthDay > daysInNewMonth) {
            setBirthDay(daysInNewMonth);
        }
        setBirthMonth(newMonth);
    };

    const handleDayChange = (newDay: number) => {
        const daysInCurrentMonth = getDaysInMonth(birthYear, birthMonth);
        if (newDay > daysInCurrentMonth) {
            setBirthDay(daysInCurrentMonth);
        } else {
            setBirthDay(newDay);
        }
    };

    const maxDays = getDaysInMonth(birthYear, birthMonth);

    return (
        <>
            <h1 className="title">平均余命カウントダウン</h1>
            <h2 className="introduction">
                一分一秒を大切に．<br />
                仕様，詳細は<Link href="/blog/life-expectancy-timer">こちら</Link>から．<br />
                男性 113 歳以上，女性 114 歳以上は対応していません．
            </h2>
            <div className="result-container">
                <h3 className="result-title">
                    平均余命まで残り
                </h3>
                <div className="result-value">
                    {(() => {
                        if (currentTime === null) {
                            return <span className="error-message">読み込み中</span>;
                        }
                        const currentAge = calculateCurrentAge(birthYear, birthMonth, birthDay, currentTime);
                        const expectancy = getInterpolatedExpectancy(currentAge, gender);
                        if (expectancy <= 0) {
                            return <span className="error-message">エラー</span>;
                        }
                        switch (viewMode) {
                            case "years":
                                // 年，日，時間，分，秒
                                const years = Math.floor(expectancy);
                                const days = Math.floor((expectancy - years) * DAYS_PER_YEAR);
                                const hours = Math.floor(((expectancy - years) * DAYS_PER_YEAR - days) * 24);
                                const minutes = Math.floor((((expectancy - years) * DAYS_PER_YEAR - days) * 24 - hours) * 60);
                                const seconds = Math.floor(((((expectancy - years) * DAYS_PER_YEAR - days) * 24 - hours) * 60 - minutes) * 60);
                                return <>
                                    <span className="result-number">{years}</span>
                                    <span className="result-unit">年</span>
                                    <span className="result-number">{days}</span>
                                    <span className="result-unit">日</span>
                                    <span className="result-number">{hours}</span>
                                    <span className="result-unit">時間</span>
                                    <span className="result-number">{minutes}</span>
                                    <span className="result-unit">分</span>
                                    <span className="result-number">{seconds}</span>
                                    <span className="result-unit">秒</span>
                                </>;
                            case "days":
                                // 日，時間，分，秒
                                const totalDays = Math.floor(expectancy * DAYS_PER_YEAR);
                                const remainingHours = Math.floor((expectancy * DAYS_PER_YEAR - totalDays) * 24);
                                const remainingMinutes = Math.floor(((expectancy * DAYS_PER_YEAR - totalDays) * 24 - remainingHours) * 60);
                                const remainingSeconds = Math.floor((((expectancy * DAYS_PER_YEAR - totalDays) * 24 - remainingHours) * 60 - remainingMinutes) * 60);
                                return <>
                                    <span className="result-number">{totalDays}</span>
                                    <span className="result-unit">日</span>
                                    <span className="result-number">{remainingHours}</span>
                                    <span className="result-unit">時間</span>
                                    <span className="result-number">{remainingMinutes}</span>
                                    <span className="result-unit">分</span>
                                    <span className="result-number">{remainingSeconds}</span>
                                    <span className="result-unit">秒</span>
                                </>;
                            case "hours":
                                // 時間，分，秒
                                const totalHours = Math.floor(expectancy * DAYS_PER_YEAR * 24);
                                const remainingMinutesForHours = Math.floor((expectancy * DAYS_PER_YEAR * 24 - totalHours) * 60);
                                const remainingSecondsForHours = Math.floor((((expectancy * DAYS_PER_YEAR * 24 - totalHours) * 60 - remainingMinutesForHours) * 60));
                                return <>
                                    <span className="result-number">{totalHours}</span>
                                    <span className="result-unit">時間</span>
                                    <span className="result-number">{remainingMinutesForHours}</span>
                                    <span className="result-unit">分</span>
                                    <span className="result-number">{remainingSecondsForHours}</span>
                                    <span className="result-unit">秒</span>
                                </>;
                            case "minutes":
                                // 分，秒
                                const totalMinutes = Math.floor(expectancy * DAYS_PER_YEAR * 24 * 60);
                                const remainingSecondsForMinutes = Math.floor((((expectancy * DAYS_PER_YEAR * 24 * 60 - totalMinutes) * 60)));
                                return <>
                                    <span className="result-number">{totalMinutes}</span>
                                    <span className="result-unit">分</span>
                                    <span className="result-number">{remainingSecondsForMinutes}</span>
                                    <span className="result-unit">秒</span>
                                </>;
                            case "seconds":
                                // 秒
                                const totalSeconds = Math.floor(expectancy * DAYS_PER_YEAR * 24 * 60 * 60);
                                return <>
                                    <span className="result-number">{totalSeconds}</span>
                                    <span className="result-unit">秒</span>
                                </>;
                            default:
                                return null;
                        }
                    })()
                    }
                </div>
                <button className="view-mode-button" onClick={changeViewMode}>表示切替</button>
            </div>

            <div className="input-container">
                <div className="birthdate-container">
                    <span className="input-label">
                        生年月日
                    </span>
                    <input
                        type="number"
                        id="birthYear"
                        className="birth-year-input"
                        value={birthYear}
                        onChange={(e) => setBirthYear(Number(e.target.value))}
                        min={1900}
                        max={2100}
                    />
                    <span className="input-unit">年</span>
                    <input
                        type="number"
                        id="birthMonth"
                        className="birth-month-input"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(Number(e.target.value))}
                        min={1}
                        max={12}
                    />
                    <span className="input-unit">月</span>
                    <input
                        type="number"
                        id="birthDay"
                        className="birth-day-input"
                        value={birthDay}
                        onChange={(e) => setBirthDay(Number(e.target.value))}
                        min={1}
                        max={maxDays}
                    />
                    <span className="input-unit">日</span>
                </div>
                <div className="gender-container">
                    <span className="gender-label">性別</span>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={gender === "male"}
                            onChange={() => setGender("male")}
                        />
                        男性
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={gender === "female"}
                            onChange={() => setGender("female")}
                        />
                        女性
                    </label>
                </div>
            </div>
            <div className="license">
                本 Web アプリでは，厚生労働省の<Link href="https://www.mhlw.go.jp/toukei/saikin/hw/life/23th/index.html">第23回生命表（完全生命表）の概況</Link>のデータを加工して使用しています．<br />
            </div>
        </>
    )
}