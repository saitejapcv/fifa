export interface Player {
  number: number;
  name: string;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
  keyPlayer?: boolean;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  flag: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  players: Player[];
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "yellow_card" | "red_card" | "substitution";
  detail: string;
}

export interface Match {
  id: string;
  stage: "group" | "knockout";
  group?: string;
  round?: string;
  homeTeam: string; // Team ID
  awayTeam: string; // Team ID
  homeScore?: number;
  awayScore?: number;
  status: "live" | "scheduled" | "completed";
  time?: string; // e.g. "72'", "Final", "18:00 kickoff"
  date: string;
  venue: string;
  events?: MatchEvent[];
}

export interface KnockoutRound {
  name: string;
  matches: Match[];
}

// 32 Teams mapped to Groups A-H
export const teamsData: Team[] = [
  // Group A
  {
    id: "usa",
    name: "United States",
    code: "USA",
    flag: "🇺🇸",
    group: "A",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 6,
    goalsAgainst: 2,
    points: 7,
    players: [
      { number: 1, name: "Matt Turner", position: "Goalkeeper" },
      { number: 5, name: "Antonee Robinson", position: "Defender" },
      { number: 4, name: "Tyler Adams", position: "Midfielder", keyPlayer: true },
      { number: 8, name: "Weston McKennie", position: "Midfielder" },
      { number: 10, name: "Christian Pulisic", position: "Forward", keyPlayer: true },
      { number: 11, name: "Brenden Aaronson", position: "Midfielder" },
      { number: 21, name: "Timothy Weah", position: "Forward" },
      { number: 9, name: "Folarin Balogun", position: "Forward" },
    ],
  },
  {
    id: "germany",
    name: "Germany",
    code: "GER",
    flag: "🇩🇪",
    group: "A",
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 3,
    points: 6,
    players: [
      { number: 1, name: "Marc-André ter Stegen", position: "Goalkeeper" },
      { number: 2, name: "Antonio Rüdiger", position: "Defender", keyPlayer: true },
      { number: 6, name: "Joshua Kimmich", position: "Midfielder" },
      { number: 10, name: "Jamal Musiala", position: "Midfielder", keyPlayer: true },
      { number: 17, name: "Florian Wirtz", position: "Midfielder" },
      { number: 7, name: "Kai Havertz", position: "Forward" },
      { number: 9, name: "Niclas Füllkrug", position: "Forward" },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    code: "JPN",
    flag: "🇯🇵",
    group: "A",
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 4,
    goalsAgainst: 5,
    points: 4,
    players: [
      { number: 23, name: "Zion Suzuki", position: "Goalkeeper" },
      { number: 22, name: "Takehiro Tomiyasu", position: "Defender", keyPlayer: true },
      { number: 6, name: "Wataru Endo", position: "Midfielder" },
      { number: 20, name: "Takefusa Kubo", position: "Forward" },
      { number: 7, name: "Kaoru Mitoma", position: "Forward", keyPlayer: true },
      { number: 9, name: "Ayase Ueda", position: "Forward" },
    ],
  },
  {
    id: "cameroon",
    name: "Cameroon",
    code: "CMR",
    flag: "🇨🇲",
    group: "A",
    played: 3,
    won: 0,
    drawn: 0,
    lost: 3,
    goalsFor: 1,
    goalsAgainst: 8,
    points: 0,
    players: [
      { number: 24, name: "André Onana", position: "Goalkeeper", keyPlayer: true },
      { number: 21, name: "Jean-Charles Castelletto", position: "Defender" },
      { number: 8, name: "André-Frank Zambo Anguissa", position: "Midfielder" },
      { number: 10, name: "Vincent Aboubakar", position: "Forward", keyPlayer: true },
      { number: 19, name: "Bryan Mbeumo", position: "Forward" },
    ],
  },

  // Group B
  {
    id: "mexico",
    name: "Mexico",
    code: "MEX",
    flag: "🇲🇽",
    group: "B",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 5,
    goalsAgainst: 2,
    points: 7,
    players: [
      { number: 1, name: "Guillermo Ochoa", position: "Goalkeeper" },
      { number: 3, name: "César Montes", position: "Defender" },
      { number: 4, name: "Edson Álvarez", position: "Midfielder", keyPlayer: true },
      { number: 18, name: "Luis Chávez", position: "Midfielder" },
      { number: 22, name: "Hirving Lozano", position: "Forward" },
      { number: 9, name: "Santiago Giménez", position: "Forward", keyPlayer: true },
    ],
  },
  {
    id: "brazil",
    name: "Brazil",
    code: "BRA",
    flag: "🇧🇷",
    group: "B",
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    goalsFor: 8,
    goalsAgainst: 2,
    points: 6,
    players: [
      { number: 1, name: "Alisson Becker", position: "Goalkeeper" },
      { number: 4, name: "Marquinhos", position: "Defender" },
      { number: 5, name: "Bruno Guimarães", position: "Midfielder" },
      { number: 10, name: "Rodrygo Goes", position: "Forward" },
      { number: 7, name: "Vinícius Júnior", position: "Forward", keyPlayer: true },
      { number: 9, name: "Endrick Felipe", position: "Forward", keyPlayer: true },
    ],
  },
  {
    id: "australia",
    name: "Australia",
    code: "AUS",
    flag: "🇦🇺",
    group: "B",
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 3,
    goalsAgainst: 5,
    points: 4,
    players: [
      { number: 1, name: "Mathew Ryan", position: "Goalkeeper" },
      { number: 19, name: "Harry Souttar", position: "Defender", keyPlayer: true },
      { number: 22, name: "Jackson Irvine", position: "Midfielder" },
      { number: 15, name: "Mitchell Duke", position: "Forward" },
    ],
  },
  {
    id: "ghana",
    name: "Ghana",
    code: "GHA",
    flag: "🇬🇭",
    group: "B",
    played: 3,
    won: 0,
    drawn: 0,
    lost: 3,
    goalsFor: 2,
    goalsAgainst: 9,
    points: 0,
    players: [
      { number: 1, name: "Lawrence Ati-Zigi", position: "Goalkeeper" },
      { number: 15, name: "Joseph Aidoo", position: "Defender" },
      { number: 20, name: "Mohammed Kudus", position: "Midfielder", keyPlayer: true },
      { number: 9, name: "Jordan Ayew", position: "Forward" },
    ],
  },

  // Group C
  {
    id: "argentina",
    name: "Argentina",
    code: "ARG",
    flag: "🇦🇷",
    group: "C",
    played: 3,
    won: 3,
    drawn: 0,
    lost: 0,
    goalsFor: 9,
    goalsAgainst: 1,
    points: 9,
    players: [
      { number: 23, name: "Emiliano Martínez", position: "Goalkeeper", keyPlayer: true },
      { number: 13, name: "Cristian Romero", position: "Defender" },
      { number: 20, name: "Alexis Mac Allister", position: "Midfielder" },
      { number: 24, name: "Enzo Fernández", position: "Midfielder" },
      { number: 10, name: "Lionel Messi", position: "Forward", keyPlayer: true },
      { number: 22, name: "Lautaro Martínez", position: "Forward" },
      { number: 9, name: "Julián Álvarez", position: "Forward" },
    ],
  },
  {
    id: "england",
    name: "England",
    code: "ENG",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    group: "C",
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 4,
    goalsAgainst: 4,
    points: 4,
    players: [
      { number: 1, name: "Jordan Pickford", position: "Goalkeeper" },
      { number: 5, name: "John Stones", position: "Defender" },
      { number: 4, name: "Declan Rice", position: "Midfielder" },
      { number: 10, name: "Jude Bellingham", position: "Midfielder", keyPlayer: true },
      { number: 7, name: "Bukayo Saka", position: "Forward" },
      { number: 9, name: "Harry Kane", position: "Forward", keyPlayer: true },
    ],
  },
  {
    id: "poland",
    name: "Poland",
    code: "POL",
    flag: "🇵🇱",
    group: "C",
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 3,
    goalsAgainst: 5,
    points: 4,
    players: [
      { number: 1, name: "Wojciech Szczęsny", position: "Goalkeeper" },
      { number: 5, name: "Jan Bednarek", position: "Defender" },
      { number: 20, name: "Piotr Zieliński", position: "Midfielder", keyPlayer: true },
      { number: 9, name: "Robert Lewandowski", position: "Forward", keyPlayer: true },
    ],
  },
  {
    id: "saudi_arabia",
    name: "Saudi Arabia",
    code: "KSA",
    flag: "🇸🇦",
    group: "C",
    played: 3,
    won: 0,
    drawn: 0,
    lost: 3,
    goalsFor: 1,
    goalsAgainst: 7,
    points: 0,
    players: [
      { number: 21, name: "Mohammed Al-Owais", position: "Goalkeeper" },
      { number: 5, name: "Ali Al-Bulaihi", position: "Defender" },
      { number: 10, name: "Salem Al-Dawsari", position: "Midfielder", keyPlayer: true },
      { number: 11, name: "Saleh Al-Shehri", position: "Forward" },
    ],
  },

  // Group D
  {
    id: "france",
    name: "France",
    code: "FRA",
    flag: "🇫🇷",
    group: "D",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 6,
    goalsAgainst: 2,
    points: 7,
    players: [
      { number: 16, name: "Mike Maignan", position: "Goalkeeper" },
      { number: 4, name: "William Saliba", position: "Defender", keyPlayer: true },
      { number: 8, name: "Aurélien Tchouaméni", position: "Midfielder" },
      { number: 7, name: "Antoine Griezmann", position: "Forward", keyPlayer: true },
      { number: 10, name: "Kylian Mbappé", position: "Forward", keyPlayer: true },
      { number: 11, name: "Ousmane Dembélé", position: "Forward" },
    ],
  },
  {
    id: "spain",
    name: "Spain",
    code: "ESP",
    flag: "🇪🇸",
    group: "D",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 7,
    goalsAgainst: 3,
    points: 7,
    players: [
      { number: 1, name: "Unai Simón", position: "Goalkeeper" },
      { number: 2, name: "Dani Carvajal", position: "Defender" },
      { number: 16, name: "Rodri Hernández", position: "Midfielder", keyPlayer: true },
      { number: 20, name: "Pedri González", position: "Midfielder" },
      { number: 19, name: "Lamine Yamal", position: "Forward", keyPlayer: true },
      { number: 17, name: "Nico Williams", position: "Forward" },
    ],
  },
  {
    id: "morocco",
    name: "Morocco",
    code: "MAR",
    flag: "🇲🇦",
    group: "D",
    played: 3,
    won: 1,
    drawn: 0,
    lost: 2,
    goalsFor: 3,
    goalsAgainst: 6,
    points: 3,
    players: [
      { number: 1, name: "Yassine Bounou", position: "Goalkeeper" },
      { number: 2, name: "Achraf Hakimi", position: "Defender", keyPlayer: true },
      { number: 4, name: "Sofyan Amrabat", position: "Midfielder" },
      { number: 7, name: "Hakim Ziyech", position: "Forward" },
      { number: 19, name: "Youssef En-Nesyri", position: "Forward", keyPlayer: true },
    ],
  },
  {
    id: "canada",
    name: "Canada",
    code: "CAN",
    flag: "🇨🇦",
    group: "D",
    played: 3,
    won: 0,
    drawn: 0,
    lost: 3,
    goalsFor: 1,
    goalsAgainst: 9,
    points: 0,
    players: [
      { number: 16, name: "Maxime Crépeau", position: "Goalkeeper" },
      { number: 2, name: "Alistair Johnston", position: "Defender" },
      { number: 19, name: "Alphonso Davies", position: "Defender", keyPlayer: true },
      { number: 7, name: "Stephen Eustáquio", position: "Midfielder" },
      { number: 9, name: "Jonathan David", position: "Forward", keyPlayer: true },
    ],
  },

  // Groups E-H (Smaller data for standard representation)
  // Group E
  { id: "italy", name: "Italy", code: "ITA", flag: "🇮🇹", group: "E", played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 4, goalsAgainst: 1, points: 7, players: [{ number: 1, name: "G. Donnarumma", position: "Goalkeeper", keyPlayer: true }, { number: 23, name: "A. Bastoni", position: "Defender" }, { number: 18, name: "N. Barella", position: "Midfielder", keyPlayer: true }] },
  { id: "uruguay", name: "Uruguay", code: "URU", flag: "🇺🇾", group: "E", played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, points: 6, players: [{ number: 15, name: "F. Valverde", position: "Midfielder", keyPlayer: true }, { number: 19, name: "D. Núñez", position: "Forward", keyPlayer: true }] },
  { id: "korea", name: "South Korea", code: "KOR", flag: "🇰🇷", group: "E", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 4, points: 4, players: [{ number: 7, name: "Son Heung-min", position: "Forward", keyPlayer: true }, { number: 18, name: "Lee Kang-in", position: "Midfielder" }] },
  { id: "senegal", name: "Senegal", code: "SEN", flag: "🇸🇳", group: "E", played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 5, points: 0, players: [{ number: 10, name: "Sadio Mané", position: "Forward", keyPlayer: true }] },

  // Group F
  { id: "portugal", name: "Portugal", code: "POR", flag: "🇵🇹", group: "F", played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, points: 7, players: [{ number: 7, name: "Cristiano Ronaldo", position: "Forward", keyPlayer: true }, { number: 8, name: "Bruno Fernandes", position: "Midfielder", keyPlayer: true }] },
  { id: "netherlands", name: "Netherlands", code: "NED", flag: "🇳🇱", group: "F", played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 2, points: 6, players: [{ number: 4, name: "Virgil van Dijk", position: "Defender", keyPlayer: true }, { number: 10, name: "Memphis Depay", position: "Forward" }] },
  { id: "ecuador", name: "Ecuador", code: "ECU", flag: "🇪🇨", group: "F", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 4, points: 4, players: [{ number: 13, name: "Enner Valencia", position: "Forward", keyPlayer: true }] },
  { id: "iran", name: "Iran", code: "IRN", flag: "🇮🇷", group: "F", played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 7, points: 0, players: [{ number: 9, name: "Mehdi Taremi", position: "Forward", keyPlayer: true }] },

  // Group G
  { id: "belgium", name: "Belgium", code: "BEL", flag: "🇧🇪", group: "G", played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 5, goalsAgainst: 2, points: 7, players: [{ number: 7, name: "Kevin De Bruyne", position: "Midfielder", keyPlayer: true }, { number: 10, name: "Romelu Lukaku", position: "Forward", keyPlayer: true }] },
  { id: "croatia", name: "Croatia", code: "CRO", flag: "🇭🇷", group: "G", played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, points: 6, players: [{ number: 10, name: "Luka Modrić", position: "Midfielder", keyPlayer: true }] },
  { id: "switzerland", name: "Switzerland", code: "SUI", flag: "🇨🇭", group: "G", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 4, points: 4, players: [{ number: 10, name: "Granit Xhaka", position: "Midfielder", keyPlayer: true }] },
  { id: "tunisia", name: "Tunisia", code: "TUN", flag: "🇹🇳", group: "G", played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 4, points: 0, players: [{ number: 10, name: "Youssef Msakni", position: "Forward" }] },

  // Group H
  { id: "denmark", name: "Denmark", code: "DEN", flag: "🇩🇰", group: "H", played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 4, goalsAgainst: 2, points: 7, players: [{ number: 10, name: "Christian Eriksen", position: "Midfielder", keyPlayer: true }] },
  { id: "colombia", name: "Colombia", code: "COL", flag: "🇨🇴", group: "H", played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, points: 6, players: [{ number: 10, name: "James Rodríguez", position: "Midfielder", keyPlayer: true }, { number: 7, name: "Luis Díaz", position: "Forward", keyPlayer: true }] },
  { id: "sweden", name: "Sweden", code: "SWE", flag: "🇸🇪", group: "H", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 4, points: 4, players: [{ number: 11, name: "A. Isak", position: "Forward", keyPlayer: true }] },
  { id: "wales", name: "Wales", code: "WAL", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", group: "H", played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 4, points: 0, players: [{ number: 10, name: "Aaron Ramsey", position: "Midfielder" }] },
];

export const matchesData: Match[] = [
  // 🔴 LIVE Matches (playing right now)
  {
    id: "live_1",
    stage: "group",
    group: "A",
    homeTeam: "germany",
    awayTeam: "usa",
    homeScore: 1,
    awayScore: 2,
    status: "live",
    time: "75'",
    date: "2026-07-15",
    venue: "MetLife Stadium",
    events: [
      { minute: 20, type: "goal", detail: "Kai Havertz (GER)" },
      { minute: 44, type: "goal", detail: "Christian Pulisic (USA)" },
      { minute: 58, type: "yellow_card", detail: "Antonio Rüdiger (GER)" },
      { minute: 62, type: "goal", detail: "Weston McKennie (USA)" },
      { minute: 70, type: "substitution", detail: "Füllkrug in, Havertz out (GER)" },
    ],
  },
  {
    id: "live_2",
    stage: "group",
    group: "B",
    homeTeam: "brazil",
    awayTeam: "mexico",
    homeScore: 1,
    awayScore: 0,
    status: "live",
    time: "32'",
    date: "2026-07-15",
    venue: "SoFi Stadium",
    events: [
      { minute: 12, type: "goal", detail: "Vinícius Júnior (BRA)" },
      { minute: 25, type: "yellow_card", detail: "Edson Álvarez (MEX)" },
    ],
  },

  // 📅 Completed/Past Matches
  {
    id: "past_1",
    stage: "group",
    group: "C",
    homeTeam: "argentina",
    awayTeam: "canada",
    homeScore: 3,
    awayScore: 1,
    status: "completed",
    time: "Final",
    date: "2026-07-12",
    venue: "Azteca Stadium",
    events: [
      { minute: 15, type: "goal", detail: "Lionel Messi (ARG)" },
      { minute: 42, type: "goal", detail: "Jonathan David (CAN)" },
      { minute: 67, type: "goal", detail: "Lautaro Martínez (ARG)" },
      { minute: 88, type: "goal", detail: "Julián Álvarez (ARG)" },
    ],
  },
  {
    id: "past_2",
    stage: "group",
    group: "A",
    homeTeam: "japan",
    awayTeam: "cameroon",
    homeScore: 2,
    awayScore: 0,
    status: "completed",
    time: "Final",
    date: "2026-07-13",
    venue: "BMO Field",
  },
  {
    id: "past_3",
    stage: "group",
    group: "D",
    homeTeam: "france",
    awayTeam: "spain",
    homeScore: 2,
    awayScore: 2,
    status: "completed",
    time: "Final",
    date: "2026-07-14",
    venue: "Mercedes-Benz Stadium",
    events: [
      { minute: 10, type: "goal", detail: "Lamine Yamal (ESP)" },
      { minute: 34, type: "goal", detail: "Kylian Mbappé (FRA)" },
      { minute: 71, type: "goal", detail: "Nico Williams (ESP)" },
      { minute: 89, type: "goal", detail: "Antoine Griezmann (FRA)" },
    ],
  },

  // 📅 Future/Scheduled Matches
  {
    id: "future_1",
    stage: "group",
    group: "E",
    homeTeam: "italy",
    awayTeam: "uruguay",
    status: "scheduled",
    time: "18:00 kickoff",
    date: "2026-07-16",
    venue: "Hard Rock Stadium",
  },
  {
    id: "future_2",
    stage: "group",
    group: "F",
    homeTeam: "portugal",
    awayTeam: "netherlands",
    status: "scheduled",
    time: "20:00 kickoff",
    date: "2026-07-16",
    venue: "AT&T Stadium",
  },
  {
    id: "future_3",
    stage: "group",
    group: "G",
    homeTeam: "belgium",
    awayTeam: "croatia",
    status: "scheduled",
    time: "15:00 kickoff",
    date: "2026-07-17",
    venue: "Lumen Field",
  },
  {
    id: "future_4",
    stage: "group",
    group: "H",
    homeTeam: "denmark",
    awayTeam: "colombia",
    status: "scheduled",
    time: "18:00 kickoff",
    date: "2026-07-17",
    venue: "Gillette Stadium",
  },
];

// Mock Knockout Bracket
// Connecting Round of 16 -> QF -> SF -> Final
export const knockoutMatches: KnockoutRound[] = [
  {
    name: "Round of 16",
    matches: [
      { id: "r16_1", stage: "knockout", round: "Round of 16", homeTeam: "usa", awayTeam: "brazil", homeScore: 2, awayScore: 1, status: "completed", time: "Final (AET)", date: "2026-07-20", venue: "MetLife Stadium" },
      { id: "r16_2", stage: "knockout", round: "Round of 16", homeTeam: "germany", awayTeam: "mexico", homeScore: 3, awayScore: 1, status: "completed", time: "Final", date: "2026-07-20", venue: "SoFi Stadium" },
      { id: "r16_3", stage: "knockout", round: "Round of 16", homeTeam: "argentina", awayTeam: "france", homeScore: 1, awayScore: 2, status: "completed", time: "Final", date: "2026-07-21", venue: "Azteca Stadium" },
      { id: "r16_4", stage: "knockout", round: "Round of 16", homeTeam: "spain", awayTeam: "england", homeScore: 2, awayScore: 1, status: "completed", time: "Final", date: "2026-07-21", venue: "Mercedes-Benz Stadium" },
      { id: "r16_5", stage: "knockout", round: "Round of 16", homeTeam: "italy", awayTeam: "netherlands", status: "scheduled", time: "18:00 kickoff", date: "2026-07-22", venue: "Hard Rock Stadium" },
      { id: "r16_6", stage: "knockout", round: "Round of 16", homeTeam: "uruguay", awayTeam: "portugal", status: "scheduled", time: "21:00 kickoff", date: "2026-07-22", venue: "AT&T Stadium" },
      { id: "r16_7", stage: "knockout", round: "Round of 16", homeTeam: "belgium", awayTeam: "colombia", status: "scheduled", time: "15:00 kickoff", date: "2026-07-23", venue: "Lumen Field" },
      { id: "r16_8", stage: "knockout", round: "Round of 16", homeTeam: "croatia", awayTeam: "denmark", status: "scheduled", time: "18:00 kickoff", date: "2026-07-23", venue: "Gillette Stadium" },
    ],
  },
  {
    name: "Quarter-Finals",
    matches: [
      { id: "qf_1", stage: "knockout", round: "Quarter-Finals", homeTeam: "usa", awayTeam: "germany", status: "scheduled", time: "TBD", date: "2026-07-26", venue: "MetLife Stadium" },
      { id: "qf_2", stage: "knockout", round: "Quarter-Finals", homeTeam: "france", awayTeam: "spain", status: "scheduled", time: "TBD", date: "2026-07-26", venue: "SoFi Stadium" },
      { id: "qf_3", stage: "knockout", round: "Quarter-Finals", homeTeam: "tbd_r16_5", awayTeam: "tbd_r16_6", status: "scheduled", time: "TBD", date: "2026-07-27", venue: "Azteca Stadium" },
      { id: "qf_4", stage: "knockout", round: "Quarter-Finals", homeTeam: "tbd_r16_7", awayTeam: "tbd_r16_8", status: "scheduled", time: "TBD", date: "2026-07-27", venue: "Mercedes-Benz Stadium" },
    ],
  },
  {
    name: "Semi-Finals",
    matches: [
      { id: "sf_1", stage: "knockout", round: "Semi-Finals", homeTeam: "tbd_qf_1", awayTeam: "tbd_qf_2", status: "scheduled", time: "TBD", date: "2026-07-30", venue: "AT&T Stadium" },
      { id: "sf_2", stage: "knockout", round: "Semi-Finals", homeTeam: "tbd_qf_3", awayTeam: "tbd_qf_4", status: "scheduled", time: "TBD", date: "2026-07-31", venue: "SoFi Stadium" },
    ],
  },
  {
    name: "Final",
    matches: [
      { id: "final", stage: "knockout", round: "Final", homeTeam: "tbd_sf_1", awayTeam: "tbd_sf_2", status: "scheduled", time: "19:00 kickoff", date: "2026-08-04", venue: "MetLife Stadium" },
    ],
  },
];

// Helper to get team by ID (handling TBD placeholders gracefully)
export function getTeam(teamId: string): { name: string; code: string; flag: string } {
  if (teamId.startsWith("tbd_r16_")) {
    const num = teamId.replace("tbd_r16_", "");
    return { name: `Winner R16 Match ${num}`, code: `W16-${num}`, flag: "🏳️" };
  }
  if (teamId.startsWith("tbd_qf_")) {
    const num = teamId.replace("tbd_qf_", "");
    return { name: `Winner QF Match ${num}`, code: `WQF-${num}`, flag: "🏳️" };
  }
  if (teamId.startsWith("tbd_sf_")) {
    const num = teamId.replace("tbd_sf_", "");
    return { name: `Winner SF Match ${num}`, code: `WSF-${num}`, flag: "🏳️" };
  }

  const team = teamsData.find((t) => t.id === teamId);
  return team || { name: teamId.toUpperCase(), code: teamId.substring(0, 3).toUpperCase(), flag: "🏳️" };
}
