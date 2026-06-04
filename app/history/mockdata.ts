export type Leg =
  | { type: "walk"; duration: string }
  | { type: "bus"; route: string; from: string; to: string; duration: string };

export type RouteSummaryStep = {
  type: "walking" | "transit";
  instruction?: string;
  duration?: string;
  distance?: string;
  lineName?: string;
  vehicleType?: string;
  departureStop?: string;
  arrivalStop?: string;
  departureTime?: string;
  arrivalTime?: string;
  live?: {
    realtimeAvailable?: boolean;
    nextDeparture?: string;
    status?: string;
  };
};

export type RouteSummary = {
  summary?: string;
  duration?: string;
  departureTime?: string | null;
  arrivalTime?: string | null;
  transitLines?: string[];
  steps?: RouteSummaryStep[];
};

export type Trip = {
  id: number;
  from: string;
  to: string;
  date: string;
  savedDate?: string;
  departureTime?: string | null;
  durationMinutes?: number | null;
  modes?: string[];
  routeSummary?: RouteSummary | null;
  legs: Leg[];
};

export const trips: Trip[] = [
  {
    id: 1,
    from: "1234 UCI Campus Dr",
    to: "456 Spectrum Center Dr",
    date: "2026-05-05",
    legs: [
      { type: "walk", duration: "3 min" },
      { type: "bus", route: "OC 57", from: "Campus Dr", to: "Alton Pkwy", duration: "18 min" },
      { type: "walk", duration: "4 min" },
    ],
  },
  {
    id: 2,
    from: "456 Spectrum Center Dr",
    to: "3333 Bristol St, Costa Mesa",
    date: "2026-05-04",
    legs: [
      { type: "walk", duration: "5 min" },
      { type: "bus", route: "OC 47", from: "Irvine Spectrum", to: "MacArthur Blvd", duration: "20 min" },
      { type: "walk", duration: "2 min" },
      { type: "bus", route: "OC 54", from: "MacArthur Blvd", to: "South Coast Plaza", duration: "12 min" },
      { type: "walk", duration: "3 min" },
    ],
  },
  {
    id: 3,
    from: "1234 UCI Campus Dr",
    to: "18601 Airport Way, Santa Ana",
    date: "2026-05-02",
    legs: [
      { type: "walk", duration: "4 min" },
      { type: "bus", route: "OC 72", from: "Campus Dr", to: "John Wayne Airport", duration: "27 min" },
      { type: "walk", duration: "6 min" },
    ],
  },
  {
    id: 4,
    from: "456 Spectrum Center Dr",
    to: "1234 UCI Campus Dr",
    date: "2026-04-30",
    legs: [
      { type: "walk", duration: "4 min" },
      { type: "bus", route: "OC 57", from: "Alton Pkwy", to: "Campus Dr", duration: "18 min" },
      { type: "walk", duration: "3 min" },
    ],
  },
  {
    id: 5,
    from: "1234 UCI Campus Dr",
    to: "Tustin Metrolink Station",
    date: "2026-04-28",
    legs: [
      { type: "walk", duration: "2 min" },
      { type: "bus", route: "OC 543", from: "UCI Campus", to: "Red Hill Ave", duration: "30 min" },
      { type: "walk", duration: "5 min" },
      { type: "bus", route: "OC 66", from: "Red Hill Ave", to: "Tustin Metrolink", duration: "10 min" },
      { type: "walk", duration: "2 min" },
    ],
  },
  {
    id: 6,
    from: "1234 UCI Campus Dr",
    to: "Old Town Orange",
    date: "2026-03-10",
    legs: [
      { type: "walk", duration: "3 min" },
      { type: "bus", route: "OC 86", from: "UCI Campus", to: "Old Town Orange", duration: "35 min" },
      { type: "walk", duration: "5 min" },
    ],
  },
];
