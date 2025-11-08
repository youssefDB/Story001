
import { Chapter, CoverData } from './types';

export const COVER_DATA: CoverData = {
    title: "البيت الذي لا ينام",
    description: "في قلبِ ليلٍ لا قمرَ فيه، يقفُ بيتٌ قديمٌ طواه النسيان. تقولُ الأساطيرُ أن جدرانه لا تعرفُ النوم، وأن أرواحًا تائهةً تهمسُ في أروقته المظلمة. الليلة، ستخطو إلى عتبته. هل ستكشفُ سرّه أم ستصبحُ جزءًا منه إلى الأبد؟",
    imagePrompt: "Dark cinematic art style, the front facade of an old, derelict, spooky victorian mansion at night, shrouded in thick fog, a single dim yellow light in one high window, ominous and foreboding atmosphere."
};

export const INITIAL_CHAPTER: Chapter = {
    title: "الهمسة الأولى",
    scene: "تفتحُ البابَ الخشبيَّ الثقيلَ فيصدرُ صريراً يمزّقُ صمتَ الليل. رائحةُ الغبارِ والخشبِ المتعفن تملأُ رئتيك. الظلامُ كثيفٌ، بالكادِ ترى أمامكَ، لكن شعورًا غريبًا بالترقّبِ يشدّكَ للداخل. فجأة، ومن عمقِ الممر المظلم، يأتي صوتٌ رقيقٌ كهمسِ الريح...",
    dialogue: "«...هل أتيت أخيرًا؟ كنتُ في انتظارك... يا...» وينطقُ باسمك.",
    imagePrompt: "Dark cinematic art style, inside a derelict abandoned house, view from the entrance hall looking down a long, dark, dusty corridor. Moonlight streams through a broken arched window, casting long, distorted shadows on the decaying floorboards.",
    imageUrl: null,
    choices: [
        "أتجه نحو مصدر الصوت.",
        "أتجاهل الصوت وأستمر في المشي بحذر.",
        "أحاول الهروب من المنزل فورًا."
    ]
};
