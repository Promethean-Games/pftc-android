import card201 from "@assets/2-01_1772647223845.png";
import card202 from "@assets/2-02_1772647223848.png";
import card203 from "@assets/2-03_1772647223849.png";
import card301 from "@assets/3-01_1772647223850.png";
import card302 from "@assets/3-02_1772647223852.png";
import card303 from "@assets/3-03_1772647223853.png";
import card304 from "@assets/3-04_1772647223855.png";
import card401 from "@assets/4-1_1772647223855.png";
import card402 from "@assets/4-2_1772647223856.png";
import card403 from "@assets/4-3_1772647223857.png";
import card404 from "@assets/4-4_1772647223857.png";
import card405 from "@assets/4-5_1772647223858.png";
import card501 from "@assets/5-01_1772647223859.png";
import card502 from "@assets/5-02_1772647223859.png";
import card503 from "@assets/5-03_1772647223860.png";
import card601 from "@assets/6-01_1772647223860.png";
import cardJoker from "@assets/Joker-card.png";
import cardBack from "@assets/Back_1772647592199.png";

export interface CourseCard {
  id: string;
  par: number | null;
  img: string;
  isJoker: boolean;
}

export const CARD_BACK_IMG = cardBack;

export const ALL_CARDS: CourseCard[] = [
  { id: "2-01", par: 2, img: card201, isJoker: false },
  { id: "2-02", par: 2, img: card202, isJoker: false },
  { id: "2-03", par: 2, img: card203, isJoker: false },
  { id: "3-01", par: 3, img: card301, isJoker: false },
  { id: "3-02", par: 3, img: card302, isJoker: false },
  { id: "3-03", par: 3, img: card303, isJoker: false },
  { id: "3-04", par: 3, img: card304, isJoker: false },
  { id: "4-01", par: 4, img: card401, isJoker: false },
  { id: "4-02", par: 4, img: card402, isJoker: false },
  { id: "4-03", par: 4, img: card403, isJoker: false },
  { id: "4-04", par: 4, img: card404, isJoker: false },
  { id: "4-05", par: 4, img: card405, isJoker: false },
  { id: "5-01", par: 5, img: card501, isJoker: false },
  { id: "5-02", par: 5, img: card502, isJoker: false },
  { id: "5-03", par: 5, img: card503, isJoker: false },
  { id: "6-01", par: 6, img: card601, isJoker: false },
  { id: "joker-1", par: null, img: cardJoker, isJoker: true },
  { id: "joker-2", par: null, img: cardJoker, isJoker: true },
];

export function shuffleDeck(): CourseCard[] {
  const deck = [...ALL_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function getCardById(id: string): CourseCard | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}
