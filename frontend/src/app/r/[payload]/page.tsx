import { redirect } from "next/navigation";
import {decode} from "@/lib/URLLengthener";

type RedirectPageProps = {
    params: Promise<{ payload: string }>;
};

export default async function RedirectPage({ params }: RedirectPageProps) {
    const { payload } = await params;
    let targetUrl: string | null = null;

    try {

        const rawPayload = decodeURIComponent(payload);
        targetUrl = decode(rawPayload);
        if (targetUrl === null) {
            return <p>無効な短縮 URL です</p>;
        }
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }
        targetUrl = encodeURI(targetUrl);
    } catch (error) {
        console.error("Failed to decode payload:", error);
    }
    if (targetUrl) {
        redirect(targetUrl);
    }
    return <p>リダイレクトに失敗</p>;
}