// The skeleton the progress tracker hangs on. Grammar topics follow the
// general order of the Madinah Arabic Course (Books 1–3); the conversation
// track follows the thematic progression of Al-Arabiyyah Bayna Yadayk.
// Topic titles only — no book content is reproduced here.

export type Track = "madinah1" | "madinah2" | "madinah3" | "conversation";

export interface Topic {
  id: string;
  track: Track;
  title: string;
  arabic: string;
}

export const TRACKS: Record<Track, { title: string; arabic: string }> = {
  madinah1: { title: "Madinah Book 1", arabic: "الْكِتَابُ الْأَوَّلُ" },
  madinah2: { title: "Madinah Book 2", arabic: "الْكِتَابُ الثَّانِي" },
  madinah3: { title: "Madinah Book 3", arabic: "الْكِتَابُ الثَّالِثُ" },
  conversation: { title: "Conversation (ABY)", arabic: "الْمُحَادَثَةُ" },
};

export const TOPICS: Topic[] = [
  // Book 1 — the nominal sentence and its building blocks
  { id: "m1-demonstratives-near", track: "madinah1", title: "Near demonstratives & basic questions", arabic: "هٰذَا، هٰذِهِ، مَا هٰذَا؟" },
  { id: "m1-definite-article", track: "madinah1", title: "The definite article & sun/moon letters", arabic: "أَلْ" },
  { id: "m1-nominal-sentence", track: "madinah1", title: "Nominal sentence: Mubtada' & Khabar", arabic: "الْمُبْتَدَأُ وَالْخَبَرُ" },
  { id: "m1-demonstratives-far", track: "madinah1", title: "Far demonstratives", arabic: "ذٰلِكَ، تِلْكَ" },
  { id: "m1-prepositions", track: "madinah1", title: "Prepositions & the genitive case", arabic: "حُرُوفُ الْجَرِّ" },
  { id: "m1-idafa", track: "madinah1", title: "Possessive construction (Iḍāfa)", arabic: "الْإِضَافَةُ" },
  { id: "m1-feminine", track: "madinah1", title: "Feminine nouns & Tā' Marbūṭa", arabic: "الْمُؤَنَّثُ" },
  { id: "m1-attached-pronouns", track: "madinah1", title: "Attached pronouns", arabic: "الضَّمَائِرُ الْمُتَّصِلَةُ" },
  { id: "m1-adjectives", track: "madinah1", title: "Adjectives & agreement (Na't)", arabic: "النَّعْتُ" },
  { id: "m1-detached-pronouns", track: "madinah1", title: "Detached pronouns", arabic: "أَنَا، أَنْتَ، هُوَ، نَحْنُ" },
  { id: "m1-plural-demonstratives", track: "madinah1", title: "Plural demonstratives", arabic: "هٰؤُلَاءِ، أُولٰئِكَ" },
  { id: "m1-sound-plurals", track: "madinah1", title: "Sound plurals", arabic: "جَمْعُ السَّالِمِ" },
  { id: "m1-broken-plurals", track: "madinah1", title: "Broken plurals", arabic: "جَمْعُ التَّكْسِيرِ" },
  { id: "m1-question-words", track: "madinah1", title: "Question words", arabic: "أَيْنَ، كَيْفَ، مَتَى، كَمْ" },
  { id: "m1-cases", track: "madinah1", title: "The three cases (Iʿrāb) basics", arabic: "الرَّفْعُ وَالنَّصْبُ وَالْجَرُّ" },

  // Book 2 — the verb and the particles that govern it
  { id: "m2-past-tense", track: "madinah2", title: "Past tense conjugation", arabic: "الْفِعْلُ الْمَاضِي" },
  { id: "m2-verbal-sentence", track: "madinah2", title: "Verbal sentence & verb–subject agreement", arabic: "الْجُمْلَةُ الْفِعْلِيَّةُ" },
  { id: "m2-fail", track: "madinah2", title: "The doer (Fāʿil)", arabic: "الْفَاعِلُ" },
  { id: "m2-mafool-bihi", track: "madinah2", title: "The direct object (Mafʿūl bihi)", arabic: "الْمَفْعُولُ بِهِ" },
  { id: "m2-present-tense", track: "madinah2", title: "Present tense conjugation", arabic: "الْفِعْلُ الْمُضَارِعُ" },
  { id: "m2-dual", track: "madinah2", title: "The dual", arabic: "الْمُثَنَّى" },
  { id: "m2-negation", track: "madinah2", title: "Negation with مَا، لَا، لَيْسَ", arabic: "النَّفْيُ" },
  { id: "m2-inna", track: "madinah2", title: "Inna and its sisters", arabic: "إِنَّ وَأَخَوَاتُهَا" },
  { id: "m2-kana", track: "madinah2", title: "Kāna and its sisters", arabic: "كَانَ وَأَخَوَاتُهَا" },
  { id: "m2-mansub-mudari", track: "madinah2", title: "Subjunctive: أَنْ، لَنْ، كَيْ", arabic: "الْمُضَارِعُ الْمَنْصُوبُ" },
  { id: "m2-majzum-mudari", track: "madinah2", title: "Jussive: لَمْ and Lā an-Nāhiya (Nahy)", arabic: "الْمُضَارِعُ الْمَجْزُومُ" },
  { id: "m2-amr", track: "madinah2", title: "The imperative (Amr)", arabic: "فِعْلُ الْأَمْرِ" },
  { id: "m2-relative-pronouns", track: "madinah2", title: "Relative pronouns", arabic: "الَّذِي، الَّتِي، الَّذِينَ" },
  { id: "m2-diptotes", track: "madinah2", title: "Diptotes", arabic: "الْمَمْنُوعُ مِنَ الصَّرْفِ" },
  { id: "m2-five-nouns", track: "madinah2", title: "The five nouns", arabic: "الْأَسْمَاءُ الْخَمْسَةُ" },
  { id: "m2-numbers", track: "madinah2", title: "Numbers & the counted noun", arabic: "الْعَدَدُ وَالْمَعْدُودُ" },
  { id: "m2-comparative", track: "madinah2", title: "Comparative & superlative", arabic: "اسْمُ التَّفْضِيلِ" },

  // Book 3 — morphology and advanced syntax
  { id: "m3-verb-forms", track: "madinah3", title: "Verb forms II–X (Hans Wehr numbering)", arabic: "الْأَفْعَالُ الْمَزِيدَةُ" },
  { id: "m3-masdar", track: "madinah3", title: "Verbal nouns (Maṣdar)", arabic: "الْمَصْدَرُ" },
  { id: "m3-participles", track: "madinah3", title: "Active & passive participles", arabic: "اسْمُ الْفَاعِلِ وَاسْمُ الْمَفْعُولِ" },
  { id: "m3-passive", track: "madinah3", title: "Passive voice & Nā'ib al-Fāʿil", arabic: "الْمَبْنِيُّ لِلْمَجْهُولِ" },
  { id: "m3-weak-verbs", track: "madinah3", title: "Weak verbs: hollow, defective, assimilated", arabic: "الْفِعْلُ الْمُعْتَلُّ" },
  { id: "m3-doubled-hamzated", track: "madinah3", title: "Doubled & hamzated verbs", arabic: "الْمُضَعَّفُ وَالْمَهْمُوزُ" },
  { id: "m3-hal", track: "madinah3", title: "Circumstantial accusative (Ḥāl)", arabic: "الْحَالُ" },
  { id: "m3-tamyiz", track: "madinah3", title: "Specification (Tamyīz)", arabic: "التَّمْيِيزُ" },
  { id: "m3-mafaeel", track: "madinah3", title: "Mafʿūl muṭlaq, li-ajlihi & fīhi", arabic: "الْمَفَاعِيلُ" },
  { id: "m3-conditionals", track: "madinah3", title: "Conditional sentences", arabic: "إِنْ، إِذَا، لَوْ" },
  { id: "m3-exception", track: "madinah3", title: "Exception (Istithnā')", arabic: "الِاسْتِثْنَاءُ" },
  { id: "m3-vocative", track: "madinah3", title: "The vocative (Nidā')", arabic: "النِّدَاءُ" },
  { id: "m3-zanna", track: "madinah3", title: "Ẓanna and its sisters", arabic: "ظَنَّ وَأَخَوَاتُهَا" },

  // Conversation track — ABY-style speaking fluency
  { id: "conv-greetings", track: "conversation", title: "Greetings & introductions", arabic: "التَّحِيَّةُ وَالتَّعَارُفُ" },
  { id: "conv-daily-life", track: "conversation", title: "Daily routine & family", arabic: "الْحَيَاةُ الْيَوْمِيَّةُ" },
  { id: "conv-adverbs", track: "conversation", title: "Conversational adverbs", arabic: "طَبْعًا، صَرَاحَةً، أَصْلًا، فِعْلًا" },
  { id: "conv-connectors", track: "conversation", title: "Connectors: لٰكِنْ، لِذٰلِكَ، مَعَ ذٰلِكَ، بَلْ", arabic: "أَدَوَاتُ الرَّبْطِ" },
  { id: "conv-opinions", track: "conversation", title: "Giving opinions & agreeing", arabic: "إِبْدَاءُ الرَّأْيِ" },
  { id: "conv-narrating", track: "conversation", title: "Narrating past events", arabic: "السَّرْدُ" },
  { id: "conv-plans", track: "conversation", title: "Plans, wishes & the future", arabic: "الْخُطَطُ وَالْمُسْتَقْبَلُ" },
];

export const TOPIC_IDS = TOPICS.map((t) => t.id) as [string, ...string[]];

export const topicById = new Map(TOPICS.map((t) => [t.id, t]));

export const MADINAH_STARTS = [
  { value: "none", label: "Haven't started", detail: "Brand new to the books" },
  { value: "book1", label: "Book 1", detail: "Nominal sentences, Iḍāfa, pronouns" },
  { value: "book2", label: "Book 2", detail: "Verbs, Fāʿil, Maf'ūl bihi, moods" },
  { value: "book3", label: "Book 3", detail: "Verb forms, weak verbs, advanced syntax" },
  { value: "done", label: "Finished all 3", detail: "Ready for fluency work" },
] as const;

export const ABY_STARTS = [
  { value: "none", label: "Not yet" },
  { value: "book1", label: "Book 1" },
  { value: "book2", label: "Book 2" },
  { value: "book3", label: "Book 3" },
  { value: "book4", label: "Book 4" },
] as const;

/** Topics the learner has already covered, based on their self-reported start. */
export function topicsBefore(madinahStart: string): Topic[] {
  const covered: Track[] =
    madinahStart === "book2"
      ? ["madinah1"]
      : madinahStart === "book3"
        ? ["madinah1", "madinah2"]
        : madinahStart === "done"
          ? ["madinah1", "madinah2", "madinah3"]
          : [];
  return TOPICS.filter((t) => covered.includes(t.track));
}
