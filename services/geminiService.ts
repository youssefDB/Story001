import { Chapter } from "../types";

// نقطة النهاية للخادم الوسيط الذي أنشأناه
const PROXY_URL = '/api/gemini-proxy'; 

/**
 * دالة عامة لإرسال الطلبات إلى الخادم الوسيط
 * @param body - محتوى الطلب الذي سيتم إرساله
 * @returns - البيانات المستلمة من الخادم الوسيط
 */
async function callProxy(body: object) {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "فشل الاتصال بالخادم الوسيط" }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error calling proxy:", error);
        throw error;
    }
}


export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const data = await callProxy({ type: 'generateImage', prompt });
        if (!data.imageUrl) {
            throw new Error("Invalid response from proxy for image generation");
        }
        return data.imageUrl;
    } catch (error) {
        console.error("Error generating image via proxy:", error);
        // Fallback placeholder
        return "https://picsum.photos/1024/768?grayscale&blur=2";
    }
};

export const generateNextChapter = async (history: { chapter: Chapter, choice: string }[]): Promise<Omit<Chapter, 'imageUrl'>> => {
    try {
        const data = await callProxy({ type: 'generateNextChapter', history });
        // Basic validation
        if (typeof data.title !== 'string' || !Array.isArray(data.choices)) {
             throw new Error("Invalid JSON structure from proxy for next chapter");
        }
        return data;
    } catch (error) {
        console.error("Error generating next chapter via proxy:", error);
        // Fallback chapter in case of error
        return {
            title: "نهاية مفاجئة",
            scene: "تتلاشى الرؤية من حولك، وتتحول الهمسات إلى صراخ يصم الآذان. يبتلعك الظلام... لقد ضللت الطريق.",
            dialogue: "",
            imagePrompt: "Dark cinematic art style, abstract horror, swirling darkness with hints of screaming faces, complete blackness encroaching from the sides.",
            choices: []
        };
    }
};

export const generateSpeech = async (scene: string, dialogue: string): Promise<string> => {
    try {
        const data = await callProxy({ type: 'generateSpeech', scene, dialogue });
        if (!data.base64Audio) {
            throw new Error("No audio data found in proxy response");
        }
        return data.base64Audio;
    } catch (error) {
        console.error("Error generating speech via proxy:", error);
        throw error;
    }
};