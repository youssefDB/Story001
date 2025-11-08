import { Chapter } from "../types";

// نقطة النهاية للخادم الوسيط الذي أنشأناه
const PROXY_URL = '/api/gemini-proxy'; 

/**
 * دالة عامة لإرسال الطلبات إلى الخادم الوسيط
 * @param body - محتوى الطلب الذي سيتم إرساله
 * @param log - دالة لتسجيل رسائل التشخيص
 * @returns - البيانات المستلمة من الخادم الوسيط
 */
async function callProxy(body: object, log: (message: string) => void) {
    log(`Calling proxy with type: ${(body as any).type}`);
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        log(`Proxy response status: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: "فشل تحليل استجابة الخطأ من الخادم", details: errorText };
            }
            const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
            log(`Proxy returned an error: ${errorMessage}. Details: ${errorData.details || 'N/A'}`);
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        log(`Proxy call successful for type: ${(body as any).type}`);
        return responseData;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`Network or parsing error in callProxy: ${errorMsg}`);
        console.error("Error calling proxy:", error);
        throw error;
    }
}


export const generateImage = async (prompt: string, log: (message: string) => void): Promise<string> => {
    try {
        const data = await callProxy({ type: 'generateImage', prompt }, log);
        if (!data.imageUrl) {
            throw new Error("Invalid response from proxy for image generation");
        }
        return data.imageUrl;
    } catch (error) {
        console.error("Error generating image via proxy:", error);
        throw error;
    }
};

export const generateNextChapter = async (history: { chapter: Chapter, choice: string }[], log: (message: string) => void): Promise<Omit<Chapter, 'imageUrl'>> => {
    try {
        const data = await callProxy({ type: 'generateNextChapter', history }, log);
        if (typeof data.title !== 'string' || !Array.isArray(data.choices)) {
             throw new Error("Invalid JSON structure from proxy for next chapter");
        }
        return data;
    } catch (error) {
        log(`Falling back to error chapter due to: ${error instanceof Error ? error.message : String(error)}`);
        console.error("Error generating next chapter via proxy:", error);
        return {
            title: "نهاية مفاجئة",
            scene: "تتلاشى الرؤية من حولك، وتتحول الهمسات إلى صراخ يصم الآذان. يبتلعك الظلام... لقد ضللت الطريق بسبب خطأ غامض.",
            dialogue: `الخطأ: ${error instanceof Error ? error.message : 'Unknown error'}`,
            imagePrompt: "Dark cinematic art style, abstract horror, swirling darkness with hints of screaming faces, complete blackness encroaching from the sides.",
            choices: []
        };
    }
};

export const generateSpeech = async (scene: string, dialogue: string, log: (message: string) => void): Promise<string> => {
    try {
        const data = await callProxy({ type: 'generateSpeech', scene, dialogue }, log);
        if (!data.base64Audio) {
            throw new Error("No audio data found in proxy response");
        }
        return data.base64Audio;
    } catch (error) {
        console.error("Error generating speech via proxy:", error);
        throw error;
    }
};
