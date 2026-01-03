import { useEffect, useState, useRef } from "react";
import loadCircleSplattingModule from "@/lib/circle-splatting.js";
import type { CircleSplattingModule } from "@/types/wasm.d.ts";

export const useCircleSplatting = () => {
    const [moduleInstance, setModuleInstance] = useState<CircleSplattingModule | null>(null);
    const isLoaded = useRef(false);

    useEffect(() => {
        if (isLoaded.current) return;
        isLoaded.current = true;
        loadCircleSplattingModule().then((module) => {
            console.log("CircleSplatting Wasm module loaded");
            setModuleInstance(module as CircleSplattingModule);
        });
    }, [])

    return moduleInstance;
}
