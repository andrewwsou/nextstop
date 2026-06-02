type TransitType = "bus" | "train" | "express";

type Segment =
  | {
      type: "walk";
    }
  | {
      type: "transit";
      label: string;
      transitType: TransitType;
    };

type RouteOption = {
  id: string;
  label?: string;
  time: string;
  depart: string;
  duration: string;
  transfers: string;
  walk: string;
  segments: Segment[];
};

const routeOptions: RouteOption[] = [
  {
    id: "suggested-oc-metrolink",
    label: "Suggested Route",
    time: "8:15 AM -> 9:08 AM",
    depart: "Leaves from nearby stop",
    duration: "53 min",
    transfers: "1 transfer",
    walk: "9 min walk",
    segments: [
      { type: "walk" },
      { type: "transit", label: "OC 57", transitType: "bus" },
      { type: "walk" },
      { type: "transit", label: "Metrolink", transitType: "train" },
      { type: "walk" },
    ],
  },
  {
    id: "oc-bus-direct",
    time: "8:24 AM -> 9:18 AM",
    depart: "Leaves from campus area",
    duration: "54 min",
    transfers: "0 transfers",
    walk: "12 min walk",
    segments: [
      { type: "walk" },
      { type: "transit", label: "OC 43", transitType: "bus" },
      { type: "walk" },
    ],
  },
  {
    id: "anteater-express-oc",
    time: "8:30 AM -> 9:35 AM",
    depart: "Uses campus shuttle connection",
    duration: "65 min",
    transfers: "1 transfer",
    walk: "6 min walk",
    segments: [
      { type: "walk" },
      { type: "transit", label: "Anteater", transitType: "express" },
      { type: "walk" },
      { type: "transit", label: "OC 54", transitType: "bus" },
      { type: "walk" },
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start")?.trim();
  const destination = searchParams.get("destination")?.trim();
  const allowedTransit = new Set(
    (searchParams.get("transit") || "bus,train,express")
      .split(",")
      .filter(Boolean)
  );

  if (!start || !destination) {
    return Response.json(
      { error: "Start and destination are required" },
      { status: 400 }
    );
  }

  const routes = routeOptions.filter((route) =>
    route.segments.every((segment) => {
      if (segment.type === "walk") {
        return true;
      }

      return allowedTransit.has(segment.transitType);
    })
  );

  return Response.json({
    start,
    destination,
    routes,
  });
}
