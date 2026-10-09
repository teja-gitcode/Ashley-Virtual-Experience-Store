import { assetUrl } from "./asset-url";

export type RoomId =
  | "lot"
  | "lobby"
  | "living"
  | "bedroom"
  | "dining"
  | "sleep"
  | "patio"
  | "kitchen"
  | "office"
  | "kids";

export type FurnitureKind =
  | "sofa"
  | "sectional"
  | "chair"
  | "coffee"
  | "tvstand"
  | "bed"
  | "twin-bed"
  | "dresser"
  | "nightstand"
  | "mattress"
  | "table"
  | "dining-chair"
  | "buffet"
  | "outdoor-sofa"
  | "outdoor-table"
  | "outdoor-dining"
  | "desk"
  | "recliner"
  | "ottoman"
  | "bookshelf"
  | "console"
  | "island"
  | "stool"
  | "office-chair"
  | "wardrobe"
  | "hutch"
  | "bench";

/** Silhouette used for pieces added after the original showroom set. */
export type FurnitureProfile =
  | "sofa-track"
  | "accent-chair"
  | "bed-upholstered"
  | "chest"
  | "table-leg"
  | "side-chair"
  | "counter-table"
  | "pantry"
  | "file-cabinet"
  | "bookcase"
  | "swivel-lounge"
  | "outdoor-ottoman"
  | "rocker";

export type SizeIn = { w: number; d: number; h: number };

export type Product = {
  id: string;
  name: string;
  collection: string;
  room: RoomId;
  price: number;
  was?: number;
  style: string;
  finish: string;
  blurb: string;
  kind: FurnitureKind;
  fabric: string;
  /** Width, depth, and height in inches. Depth is local Z, the front-to-back axis. */
  size: SizeIn;
  profile?: FurnitureProfile;
};

export const ROOMS: {
  id: RoomId;
  label: string;
  hint: string;
  spawn: [number, number];
}[] = [
  { id: "lot", label: "Driveway", hint: "Park & walk in", spawn: [0, 23.5] },
  { id: "lobby", label: "Gallery", hint: "Start here", spawn: [4.5, 12] },
  { id: "living", label: "Living", hint: "Sofas & tables", spawn: [-8.2, 1.6] },
  { id: "bedroom", label: "Bedroom", hint: "Beds & storage", spawn: [11.4, 1.1] },
  { id: "dining", label: "Dining", hint: "Tables & chairs", spawn: [-5.4, -8.6] },
  { id: "sleep", label: "Sleep", hint: "Mattress gallery", spawn: [10, -8.2] },
  { id: "kitchen", label: "Kitchen", hint: "Islands & stools", spawn: [-21.2, -3.2] },
  { id: "kids", label: "Kids", hint: "Twins & storage", spawn: [21.2, 0.2] },
  { id: "office", label: "Office", hint: "Desks & bookcases", spawn: [21.4, -10.2] },
  { id: "patio", label: "Patio", hint: "Outdoor living", spawn: [0, -23.2] },
];

const PRODUCT_DRAFTS: Omit<Product, "size">[] = [
  {
    id: "darcy-sofa",
    name: "Darcy Sofa",
    collection: "Darcy",
    room: "living",
    price: 599,
    was: 749,
    style: "Contemporary",
    finish: "Charcoal microfiber",
    blurb:
      "The floor favorite. Deep seats, track arms, and a charcoal cover that hides real life. Built for movie nights that run long.",
    kind: "sofa",
    fabric: "charcoal",
  },
  {
    id: "navi-sectional",
    name: "Navi 3-Piece Sectional",
    collection: "Navi",
    room: "living",
    price: 1399,
    was: 1699,
    style: "Casual contemporary",
    finish: "Pebble woven",
    blurb:
      "A low, loungey L that swallows a whole family. Reversible chaise energy without the precious fabric.",
    kind: "sectional",
    fabric: "pebble",
  },
  {
    id: "abinger-chair",
    name: "Abinger Accent Chair",
    collection: "Abinger",
    room: "living",
    price: 399,
    style: "Contemporary",
    finish: "Smoke chenille",
    blurb:
      "A compact club chair with a soft sit and slim arms — the extra seat you actually use.",
    kind: "chair",
    fabric: "smoke",
  },
  {
    id: "gerridan-table",
    name: "Gerridan Cocktail Table",
    collection: "Gerridan",
    room: "living",
    price: 279,
    style: "Rustic casual",
    finish: "White rustic oak",
    blurb:
      "Plank-look top, open lower shelf, and enough surface for remotes, books, and a Saturday pizza.",
    kind: "coffee",
    fabric: "whitewash",
  },
  {
    id: "gerridan-tv",
    name: "Gerridan 60-Inch TV Stand",
    collection: "Gerridan",
    room: "living",
    price: 399,
    style: "Rustic casual",
    finish: "White rustic oak",
    blurb: "Two cabinets, open cubbies, and cable cutouts. Made to float a 65-inch without looking busy.",
    kind: "tvstand",
    fabric: "whitewash",
  },
  {
    id: "darcy-ottoman",
    name: "Darcy Ottoman",
    collection: "Darcy",
    room: "living",
    price: 199,
    style: "Contemporary",
    finish: "Charcoal microfiber",
    blurb: "A squat, sturdy ottoman that works as a footrest, extra seat, or coffee-table stand-in.",
    kind: "ottoman",
    fabric: "charcoal",
  },
  {
    id: "luckenack-recliner",
    name: "Luckenack Recliner",
    collection: "Luckenack",
    room: "living",
    price: 449,
    style: "Casual",
    finish: "Navy padded knit",
    blurb: "A thick-pad recliner with a kick-out footrest. The chair people fight over on game night.",
    kind: "recliner",
    fabric: "navy",
  },
  {
    id: "gerridan-bookcase",
    name: "Gerridan Bookcase",
    collection: "Gerridan",
    room: "living",
    price: 329,
    style: "Rustic casual",
    finish: "White rustic oak",
    blurb: "Four open shelves for the books you actually read and the baskets you pretend organize you.",
    kind: "bookshelf",
    fabric: "whitewash",
  },
  {
    id: "brinxton-bed",
    name: "Brinxton Queen Panel Bed",
    collection: "Brinxton",
    room: "bedroom",
    price: 499,
    was: 599,
    style: "Contemporary",
    finish: "Charcoal replicated oak",
    blurb:
      "A tall, quiet headboard with clean rails. Dark charcoal grain that grounds a pale room.",
    kind: "bed",
    fabric: "charcoal",
  },
  {
    id: "anarasia-nightstand",
    name: "Anarasia Nightstand",
    collection: "Anarasia",
    room: "bedroom",
    price: 179,
    style: "Casual cottage",
    finish: "Two-tone white & rustic gray",
    blurb: "One drawer, one open cubby, and a USB-ready top for phones that never stay charged.",
    kind: "nightstand",
    fabric: "whitewash",
  },
  {
    id: "porter-dresser",
    name: "Porter Dresser",
    collection: "Porter",
    room: "bedroom",
    price: 699,
    style: "Casual rustic",
    finish: "Burnished brown",
    blurb: "Six roomy drawers with burnished hardware. The kind of dresser that actually eats laundry.",
    kind: "dresser",
    fabric: "rust",
  },
  {
    id: "willowton-bed",
    name: "Willowton Queen Panel Bed",
    collection: "Willowton",
    room: "bedroom",
    price: 549,
    style: "Cottage",
    finish: "Whitewash plank",
    blurb: "Distressed white plank and a beachy headboard. Soft, coastal, not theme-park.",
    kind: "bed",
    fabric: "whitewash",
  },
  {
    id: "brinxton-bench",
    name: "Brinxton Storage Bench",
    collection: "Brinxton",
    room: "bedroom",
    price: 229,
    style: "Contemporary",
    finish: "Charcoal with linen cushion",
    blurb: "A lift-top bench for the foot of the bed. Throws go in, shoes stay off the quilt.",
    kind: "bench",
    fabric: "charcoal",
  },
  {
    id: "porter-wardrobe",
    name: "Porter Wardrobe",
    collection: "Porter",
    room: "bedroom",
    price: 799,
    style: "Casual rustic",
    finish: "Burnished brown",
    blurb: "A tall two-door wardrobe when the closet is a wish, not a room.",
    kind: "wardrobe",
    fabric: "rust",
  },
  {
    id: "bolanburg-table",
    name: "Bolanburg Dining Table",
    collection: "Bolanburg",
    room: "dining",
    price: 649,
    style: "Farmhouse",
    finish: "Two-tone antique white & oak",
    blurb:
      "A thick plank top on a two-tone trestle. The table people linger at after the plates are gone.",
    kind: "table",
    fabric: "whitewash",
  },
  {
    id: "bolanburg-chair",
    name: "Bolanburg Dining Chair",
    collection: "Bolanburg",
    room: "dining",
    price: 149,
    style: "Farmhouse",
    finish: "Antique white with linen seat",
    blurb: "Lattice back, upholstered seat, and a sit that works for a long Sunday lunch.",
    kind: "dining-chair",
    fabric: "linen",
  },
  {
    id: "haddigan-buffet",
    name: "Haddigan Server",
    collection: "Haddigan",
    room: "dining",
    price: 599,
    style: "Casual rustic",
    finish: "Dark bourbon oak",
    blurb: "Wine storage, drawers, and a serving top. The sideboard that earns its footprint.",
    kind: "buffet",
    fabric: "rust",
  },
  {
    id: "haddigan-hutch",
    name: "Haddigan China Hutch",
    collection: "Haddigan",
    room: "dining",
    price: 899,
    style: "Casual rustic",
    finish: "Dark bourbon oak",
    blurb: "A tall hutch for the good dishes and the serving pieces that come out twice a year.",
    kind: "hutch",
    fabric: "rust",
  },
  {
    id: "chime-12",
    name: "Chime 12-Inch Memory Foam",
    collection: "Chime",
    room: "sleep",
    price: 399,
    was: 499,
    style: "Modern sleep",
    finish: "Quilted knit cover",
    blurb: "The mattress that made Ashley a sleep destination. Pressure-relieving foam with a cool-touch cover.",
    kind: "mattress",
    fabric: "linen",
  },
  {
    id: "chime-10",
    name: "Chime 10-Inch Memory Foam",
    collection: "Chime",
    room: "sleep",
    price: 299,
    style: "Modern sleep",
    finish: "Quilted knit cover",
    blurb: "A guest-room workhorse. Supportive foam at a price that makes a second bedroom easy.",
    kind: "mattress",
    fabric: "pebble",
  },
  {
    id: "chime-8",
    name: "Chime 8-Inch Memory Foam",
    collection: "Chime",
    room: "sleep",
    price: 199,
    style: "Modern sleep",
    finish: "Knit cover",
    blurb: "The slim guest-room mattress. Same Chime foam feel in an eight-inch profile that sits clean on a bunk or a trundle.",
    kind: "mattress",
    fabric: "sage",
  },
  {
    id: "sleep-hybrid",
    name: "Ashley Sleep 13-Inch Hybrid",
    collection: "Ashley Sleep",
    room: "sleep",
    price: 699,
    was: 899,
    style: "Hybrid",
    finish: "Euro-top knit",
    blurb: "Coils for bounce, foam for hush. The middle-path mattress for combination sleepers.",
    kind: "mattress",
    fabric: "navy",
  },
  {
    id: "beachcroft-sofa",
    name: "Beachcroft Outdoor Sofa",
    collection: "Beachcroft",
    room: "patio",
    price: 899,
    style: "Coastal outdoor",
    finish: "Beige all-weather weave",
    blurb: "Resin wicker over rust-proof frames with deep, drainable cushions. Porch weather, living-room sit.",
    kind: "outdoor-sofa",
    fabric: "sand",
  },
  {
    id: "beachcroft-table",
    name: "Beachcroft Coffee Table",
    collection: "Beachcroft",
    room: "patio",
    price: 349,
    style: "Coastal outdoor",
    finish: "Teak-look slat top",
    blurb: "Open slat top so summer storms pass through. Matches the Beachcroft seating exactly.",
    kind: "outdoor-table",
    fabric: "whitewash",
  },
  {
    id: "palmetto-dining",
    name: "Palmetto Heights Dining Set",
    collection: "Palmetto Heights",
    room: "patio",
    price: 1199,
    style: "Outdoor dining",
    finish: "Eucalyptus slat with sand chairs",
    blurb: "A six-seat outdoor table for the first warm night of the year. Umbrella-ready center.",
    kind: "outdoor-dining",
    fabric: "sand",
  },
  {
    id: "skempton-island",
    name: "Skempton Kitchen Island",
    collection: "Skempton",
    room: "kitchen",
    price: 749,
    style: "Casual dining",
    finish: "White with natural oak top",
    blurb: "A working island with an oak butcher-block top, open shelf, and room for three stools.",
    kind: "island",
    fabric: "whitewash",
  },
  {
    id: "valebeck-stool",
    name: "Valebeck Bar Stool",
    collection: "Valebeck",
    room: "kitchen",
    price: 159,
    style: "Casual",
    finish: "Sand upholstered seat",
    blurb: "A sturdy counter stool with a footrest you will actually use while the pasta water boils.",
    kind: "stool",
    fabric: "sand",
  },
  {
    id: "bolanburg-hutch",
    name: "Bolanburg Kitchen Hutch",
    collection: "Bolanburg",
    room: "kitchen",
    price: 849,
    style: "Farmhouse",
    finish: "Two-tone antique white",
    blurb: "Open plate racks over closed cabinets. The piece that makes a showroom kitchen feel lived in.",
    kind: "hutch",
    fabric: "whitewash",
  },
  {
    id: "realyn-desk",
    name: "Realyn Home Office Desk",
    collection: "Realyn",
    room: "office",
    price: 449,
    style: "Cottage",
    finish: "Chipped white with oak top",
    blurb: "A writing desk with enough drawer space for the chargers, stamps, and tax folder.",
    kind: "desk",
    fabric: "whitewash",
  },
  {
    id: "hon-chair",
    name: "Office Swivel Chair",
    collection: "Signature Design",
    room: "office",
    price: 229,
    style: "Contemporary",
    finish: "Charcoal knit",
    blurb: "A five-star base, a back that supports a real workday, and a sit that does not shout 'gaming'.",
    kind: "office-chair",
    fabric: "charcoal",
  },
  {
    id: "carlyle-bookcase",
    name: "Carlyle Bookcase",
    collection: "Carlyle",
    room: "office",
    price: 379,
    style: "Traditional",
    finish: "Burnished brown",
    blurb: "Tall shelves for the hardcovers and the framed kids' art that never quite makes it to a wall.",
    kind: "bookshelf",
    fabric: "rust",
  },
  {
    id: "realyn-console",
    name: "Realyn Sofa Table",
    collection: "Realyn",
    room: "office",
    price: 349,
    style: "Cottage",
    finish: "Chipped white",
    blurb: "A long, narrow console for a printer, a lamp, and the mail that lands every afternoon.",
    kind: "console",
    fabric: "whitewash",
  },
  {
    id: "fortville-bed",
    name: "Fortville Twin Panel Bed",
    collection: "Fortville",
    room: "kids",
    price: 329,
    style: "Casual kids",
    finish: "Warm rustic oak",
    blurb: "A twin panel bed that grows with them — sturdy rails, a low profile, no theme that dates next year.",
    kind: "twin-bed",
    fabric: "sand",
  },
  {
    id: "kids-dresser",
    name: "Anarasia Kids Dresser",
    collection: "Anarasia",
    room: "kids",
    price: 449,
    style: "Casual cottage",
    finish: "Two-tone white",
    blurb: "Wide drawers for the clothes that never stay folded and the extra sheet set.",
    kind: "dresser",
    fabric: "whitewash",
  },
  {
    id: "kids-desk",
    name: "Realyn Kids Desk",
    collection: "Realyn",
    room: "kids",
    price: 299,
    style: "Cottage",
    finish: "Chipped white",
    blurb: "Homework, crafts, and a laptop. A desk that survives stickers.",
    kind: "desk",
    fabric: "whitewash",
  },
  {
    id: "kids-ottoman",
    name: "Kids Storage Ottoman",
    collection: "Signature Design",
    room: "kids",
    price: 129,
    style: "Casual kids",
    finish: "Blush knit",
    blurb: "A soft cube that hides toys and works as a seat for story time.",
    kind: "ottoman",
    fabric: "blush",
  },
  {
    id: "altari-sofa",
    name: "Altari Sofa",
    collection: "Altari",
    room: "living",
    price: 499,
    was: 599,
    style: "Contemporary",
    finish: "Alloy performance fabric",
    blurb:
      "The volume sofa. Track arms, three seat cushions, and a slate cover that reads clean from across the room.",
    kind: "sofa",
    fabric: "slate",
    profile: "sofa-track",
  },
  {
    id: "altari-chair",
    name: "Altari Accent Chair",
    collection: "Altari",
    room: "living",
    price: 299,
    style: "Contemporary",
    finish: "Alloy performance fabric",
    blurb: "The matching chair. Same track arm and cushion break as the sofa, sized for the corner.",
    kind: "chair",
    fabric: "slate",
    profile: "accent-chair",
  },
  {
    id: "dolante-bed",
    name: "Dolante Upholstered Queen Bed",
    collection: "Dolante",
    room: "bedroom",
    price: 349,
    was: 449,
    style: "Contemporary",
    finish: "Light gray linen",
    blurb:
      "A padded wing headboard with no posts to bump. The upholstered bed shoppers compare everything else to.",
    kind: "bed",
    fabric: "linen",
    profile: "bed-upholstered",
  },
  {
    id: "shawburn-chest",
    name: "Shawburn Five-Drawer Chest",
    collection: "Shawburn",
    room: "bedroom",
    price: 399,
    style: "Casual contemporary",
    finish: "Dark brown replicated wood",
    blurb: "A tall, narrow chest for the wall that cannot take another dresser. Five deep drawers.",
    kind: "dresser",
    fabric: "rust",
    profile: "chest",
  },
  {
    id: "lyncott-table",
    name: "Lyncott Dining Table",
    collection: "Lyncott",
    room: "dining",
    price: 549,
    was: 699,
    style: "Contemporary",
    finish: "Dark brown wood",
    blurb: "A straight four-leg table with a thick top. Seats four without the trestle of the farmhouse set.",
    kind: "table",
    fabric: "rust",
    profile: "table-leg",
  },
  {
    id: "lyncott-chair",
    name: "Lyncott Dining Chair",
    collection: "Lyncott",
    room: "dining",
    price: 129,
    style: "Contemporary",
    finish: "Dark wood with linen seat",
    blurb: "A slim side chair with an upholstered seat. Built to tuck under the Lyncott top.",
    kind: "dining-chair",
    fabric: "linen",
    profile: "side-chair",
  },
  {
    id: "valebeck-counter",
    name: "Valebeck Counter Table",
    collection: "Valebeck",
    room: "kitchen",
    price: 279,
    style: "Casual",
    finish: "Natural oak top",
    blurb: "Counter height, not dining height. Two stools slide under it while the island stays the main stage.",
    kind: "table",
    fabric: "whitewash",
    profile: "counter-table",
  },
  {
    id: "bolanburg-pantry",
    name: "Bolanburg Pantry Cabinet",
    collection: "Bolanburg",
    room: "kitchen",
    price: 649,
    style: "Farmhouse",
    finish: "Two-tone antique white",
    blurb: "A tall pantry with an open shelf on top. Flour, trays, and the good platters live here.",
    kind: "wardrobe",
    fabric: "whitewash",
    profile: "pantry",
  },
  {
    id: "carlyle-file",
    name: "Carlyle File Cabinet",
    collection: "Carlyle",
    room: "office",
    price: 249,
    style: "Traditional",
    finish: "Burnished brown",
    blurb: "Two file drawers in a low cabinet. Paperwork stays off the desktop.",
    kind: "dresser",
    fabric: "rust",
    profile: "file-cabinet",
  },
  {
    id: "fortville-bookcase",
    name: "Fortville Bookcase",
    collection: "Fortville",
    room: "kids",
    price: 199,
    style: "Casual kids",
    finish: "Warm rustic oak",
    blurb: "Open shelves for books, bins, and the trophies that will not fit a dresser top.",
    kind: "bookshelf",
    fabric: "sand",
    profile: "bookcase",
  },
  {
    id: "paradise-chair",
    name: "Paradise Trail Swivel Chair",
    collection: "Paradise Trail",
    room: "patio",
    price: 449,
    style: "Outdoor lounge",
    finish: "Sand all-weather cushion",
    blurb: "A swivel lounge with a rust-proof base. Turns toward the conversation without lifting the chair.",
    kind: "chair",
    fabric: "sand",
    profile: "swivel-lounge",
  },
  {
    id: "paradise-ottoman",
    name: "Paradise Trail Ottoman",
    collection: "Paradise Trail",
    room: "patio",
    price: 199,
    style: "Outdoor lounge",
    finish: "Sand all-weather cushion",
    blurb: "The matching ottoman. Feet up, or a perch for a tray when the table is inside.",
    kind: "ottoman",
    fabric: "sand",
    profile: "outdoor-ottoman",
  },
  {
    id: "maverick-rocker",
    name: "Maverick Rocker",
    collection: "Maverick",
    room: "lobby",
    price: 349,
    style: "Classic",
    finish: "Walnut and charcoal weave",
    blurb:
      "A walnut rocker with a charcoal seat, spindle back, and short curved feet. It fits a nursery or a reading corner at home.",
    kind: "chair",
    fabric: "charcoal",
    profile: "rocker",
  },
];

const SIZES: Record<string, SizeIn> = {
  "darcy-sofa": { w: 89, d: 38, h: 39 },
  "navi-sectional": { w: 113, d: 87, h: 38 },
  "abinger-chair": { w: 33, d: 35, h: 37 },
  "gerridan-table": { w: 48, d: 28, h: 18 },
  "gerridan-tv": { w: 60, d: 16, h: 24 },
  "darcy-ottoman": { w: 38, d: 24, h: 19 },
  "luckenack-recliner": { w: 41, d: 40, h: 41 },
  "gerridan-bookcase": { w: 36, d: 14, h: 72 },
  "brinxton-bed": { w: 65, d: 87, h: 54 },
  "anarasia-nightstand": { w: 22, d: 16, h: 25 },
  "porter-dresser": { w: 62, d: 18, h: 38 },
  "willowton-bed": { w: 66, d: 86, h: 48 },
  "brinxton-bench": { w: 50, d: 18, h: 18 },
  "porter-wardrobe": { w: 42, d: 22, h: 74 },
  "bolanburg-table": { w: 72, d: 40, h: 30 },
  "bolanburg-chair": { w: 19, d: 24, h: 40 },
  "haddigan-buffet": { w: 66, d: 20, h: 36 },
  "haddigan-hutch": { w: 54, d: 18, h: 80 },
  "chime-12": { w: 80, d: 60, h: 12 },
  "chime-10": { w: 80, d: 60, h: 10 },
  "chime-8": { w: 80, d: 60, h: 8 },
  "sleep-hybrid": { w: 80, d: 60, h: 13 },
  "beachcroft-sofa": { w: 84, d: 35, h: 35 },
  "beachcroft-table": { w: 47, d: 24, h: 18 },
  "palmetto-dining": { w: 84, d: 60, h: 30 },
  "skempton-island": { w: 72, d: 36, h: 36 },
  "valebeck-stool": { w: 18, d: 20, h: 42 },
  "bolanburg-hutch": { w: 48, d: 18, h: 78 },
  "realyn-desk": { w: 60, d: 28, h: 30 },
  "hon-chair": { w: 26, d: 26, h: 40 },
  "carlyle-bookcase": { w: 36, d: 15, h: 78 },
  "realyn-console": { w: 48, d: 16, h: 30 },
  "fortville-bed": { w: 42, d: 79, h: 46 },
  "kids-dresser": { w: 54, d: 18, h: 36 },
  "kids-desk": { w: 48, d: 22, h: 30 },
  "kids-ottoman": { w: 18, d: 18, h: 16 },
  "altari-sofa": { w: 85, d: 38, h: 37 },
  "altari-chair": { w: 39, d: 38, h: 37 },
  "dolante-bed": { w: 65, d: 87, h: 49 },
  "shawburn-chest": { w: 42, d: 18, h: 54 },
  "lyncott-table": { w: 72, d: 40, h: 30 },
  "lyncott-chair": { w: 19, d: 23, h: 40 },
  "valebeck-counter": { w: 48, d: 24, h: 36 },
  "bolanburg-pantry": { w: 48, d: 18, h: 72 },
  "carlyle-file": { w: 36, d: 20, h: 30 },
  "fortville-bookcase": { w: 32, d: 15, h: 72 },
  "paradise-chair": { w: 31, d: 33, h: 35 },
  "paradise-ottoman": { w: 25, d: 22, h: 18 },
  "maverick-rocker": { w: 28, d: 36, h: 42 },
};

export const PRODUCTS: Product[] = PRODUCT_DRAFTS.map((draft) => {
  const size = SIZES[draft.id];
  if (!size) throw new Error(`Missing size for ${draft.id}`);
  return { ...draft, size };
});

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export type Placement = {
  productId: string;
  x: number;
  z: number;
  rot: number;
  collideW: number;
  collideD: number;
  /** Newer floor pieces. The clearance audit treats these as must-pass. */
  fresh?: boolean;
};

const SNAP_KINDS = new Set<FurnitureKind>([
  "sofa",
  "sectional",
  "bed",
  "twin-bed",
  "dresser",
  "bookshelf",
  "hutch",
  "wardrobe",
  "tvstand",
  "buffet",
  "console",
]);

export function snapsToWall(product: Product) {
  if (
    product.profile === "chest" ||
    product.profile === "pantry" ||
    product.profile === "file-cabinet" ||
    product.profile === "bookcase" ||
    product.profile === "bed-upholstered" ||
    product.profile === "sofa-track"
  ) {
    return true;
  }
  return SNAP_KINDS.has(product.kind);
}

/**
 * rot is three.js Y rotation. Local +Z is the front (seat, drawers, mattress foot).
 * Local -Z is the back (sofa back, headboard). Put the back against a wall.
 */
export const PLACEMENTS: Placement[] = [
  // Lobby — sofa faces the entrance so the front reads on the start camera
  { productId: "darcy-sofa", x: 7.4, z: 10.5, rot: 0, collideW: 2.5, collideD: 1.1 },
  { productId: "gerridan-table", x: 7.4, z: 11.55, rot: 0, collideW: 1.3, collideD: 0.75 },
  { productId: "abinger-chair", x: 9.4, z: 11.3, rot: -Math.PI * 0.55, collideW: 0.85, collideD: 0.85 },
  // Living — sofa back to west wall, TV faces the sofa, sectional faces into the room
  { productId: "darcy-sofa", x: -15.5, z: 0.4, rot: Math.PI / 2, collideW: 2.5, collideD: 1.1 },
  { productId: "gerridan-table", x: -11.0, z: 0.38, rot: 0, collideW: 1.3, collideD: 0.75 },
  { productId: "abinger-chair", x: -10.8, z: 2.15, rot: Math.PI * 0.58, collideW: 0.85, collideD: 0.85 },
  { productId: "gerridan-tv", x: -5.7, z: 0.4, rot: -Math.PI / 2, collideW: 0.5, collideD: 1.9 },
  { productId: "navi-sectional", x: -11.15, z: -1.15, rot: 0, collideW: 2.65, collideD: 1.75 },
  { productId: "darcy-ottoman", x: -14.4, z: 0.4, rot: 0, collideW: 0.75, collideD: 0.75 },
  { productId: "luckenack-recliner", x: -16.2, z: 2.45, rot: Math.PI * 0.65, collideW: 0.95, collideD: 1.05 },
  { productId: "gerridan-bookcase", x: -6.4, z: 3.15, rot: Math.PI, collideW: 1.15, collideD: 0.38 },
  // Bedroom — headboards on solid wall, clear of the sleep door (x 8.3–12) and the kids door (east, z -0.8–1.5).
  { productId: "brinxton-bed", x: 16.94, z: -2.36, rot: -Math.PI / 2, collideW: 1.8, collideD: 2.05 },
  { productId: "anarasia-nightstand", x: 17.73, z: -1.16, rot: -Math.PI / 2, collideW: 0.55, collideD: 0.48 },
  { productId: "anarasia-nightstand", x: 17.73, z: -3.51, rot: -Math.PI / 2, collideW: 0.55, collideD: 0.48 },
  { productId: "porter-dresser", x: 16.6, z: 3.55, rot: Math.PI, collideW: 1.8, collideD: 0.55 },
  { productId: "willowton-bed", x: 4.4, z: -2.79, rot: 0, collideW: 1.8, collideD: 2.05 },
  { productId: "brinxton-bench", x: 4.4, z: -1.42, rot: 0, collideW: 1.2, collideD: 0.42 },
  { productId: "porter-wardrobe", x: 2.16, z: 2.55, rot: Math.PI / 2, collideW: 1.15, collideD: 0.55 },
  // Dining — chairs face the table; buffet/hutch backs to walls
  { productId: "bolanburg-table", x: -10.2, z: -12.0, rot: 0, collideW: 2.1, collideD: 1.05 },
  { productId: "bolanburg-chair", x: -10.2, z: -10.55, rot: Math.PI, collideW: 0.5, collideD: 0.5 },
  { productId: "bolanburg-chair", x: -11.3, z: -10.55, rot: Math.PI, collideW: 0.5, collideD: 0.5 },
  { productId: "bolanburg-chair", x: -9.1, z: -10.55, rot: Math.PI, collideW: 0.5, collideD: 0.5 },
  { productId: "bolanburg-chair", x: -10.2, z: -13.45, rot: 0, collideW: 0.5, collideD: 0.5 },
  { productId: "bolanburg-chair", x: -11.3, z: -13.45, rot: 0, collideW: 0.5, collideD: 0.5 },
  { productId: "bolanburg-chair", x: -9.1, z: -13.45, rot: 0, collideW: 0.5, collideD: 0.5 },
  { productId: "haddigan-buffet", x: -17.68, z: -16.0, rot: Math.PI / 2, collideW: 2.0, collideD: 0.55 },
  { productId: "haddigan-hutch", x: -10.2, z: -18.55, rot: 0, collideW: 1.3, collideD: 0.5 },
  // Sleep — four mattresses spread along the patio wall, long axis into the room.
  { productId: "chime-8", x: 5.08, z: -18.89, rot: Math.PI / 2, collideW: 2.15, collideD: 1.12 },
  { productId: "chime-10", x: 8.33, z: -18.89, rot: Math.PI / 2, collideW: 2.15, collideD: 1.12 },
  { productId: "chime-12", x: 11.57, z: -18.89, rot: Math.PI / 2, collideW: 2.15, collideD: 1.12 },
  { productId: "sleep-hybrid", x: 14.81, z: -18.89, rot: Math.PI / 2, collideW: 2.15, collideD: 1.12 },
  // Patio — sofas face each other across the table
  { productId: "beachcroft-sofa", x: -7.2, z: -25.4, rot: 0, collideW: 2.3, collideD: 0.95 },
  { productId: "beachcroft-table", x: -7.2, z: -23.65, rot: 0, collideW: 1.2, collideD: 0.7 },
  { productId: "beachcroft-sofa", x: -7.2, z: -21.9, rot: Math.PI, collideW: 2.3, collideD: 0.95 },
  { productId: "palmetto-dining", x: 7.4, z: -25.0, rot: 0, collideW: 2.4, collideD: 1.4 },
  { productId: "beachcroft-table", x: 7.4, z: -22.7, rot: 0, collideW: 1.2, collideD: 0.7 },
  // Kitchen — hutch back to the west wall
  { productId: "skempton-island", x: -22.1, z: -7.4, rot: 0, collideW: 1.85, collideD: 0.95 },
  { productId: "valebeck-stool", x: -23.0, z: -6.15, rot: Math.PI, collideW: 0.4, collideD: 0.4 },
  { productId: "valebeck-stool", x: -22.1, z: -6.15, rot: Math.PI, collideW: 0.4, collideD: 0.4 },
  { productId: "valebeck-stool", x: -21.2, z: -6.15, rot: Math.PI, collideW: 0.4, collideD: 0.4 },
  { productId: "bolanburg-hutch", x: -25.4, z: -12.2, rot: Math.PI / 2, collideW: 1.25, collideD: 0.5 },
  // Office — bookcase back to the east wall
  { productId: "realyn-desk", x: 22.4, z: -16.6, rot: 0, collideW: 2.2, collideD: 0.75 },
  { productId: "hon-chair", x: 22.4, z: -15.35, rot: Math.PI, collideW: 0.65, collideD: 0.65 },
  { productId: "carlyle-bookcase", x: 25.4, z: -12.4, rot: -Math.PI / 2, collideW: 1.2, collideD: 0.38 },
  { productId: "realyn-console", x: 21.2, z: -19.35, rot: 0, collideW: 1.7, collideD: 0.4 },
  // Kids — twin headboard on the east wall
  { productId: "fortville-bed", x: 24.55, z: 0.4, rot: -Math.PI / 2, collideW: 1.15, collideD: 2.05 },
  { productId: "kids-dresser", x: 20.4, z: -3.15, rot: 0, collideW: 1.6, collideD: 0.5 },
  { productId: "kids-desk", x: 20.5, z: 3.15, rot: Math.PI, collideW: 1.6, collideD: 0.65 },
  { productId: "kids-ottoman", x: 22.6, z: 1.8, rot: 0.2, collideW: 0.6, collideD: 0.6 },
  // Newer collections. Back (−Z) sits on a solid wall; front faces into the room, off every door.
  { productId: "altari-sofa", x: -14.4, z: -3.28, rot: 0, collideW: 2.159, collideD: 0.965, fresh: true },
  { productId: "altari-chair", x: -16.55, z: -3.28, rot: 0, collideW: 0.991, collideD: 0.965, fresh: true },
  { productId: "dolante-bed", x: 6.0, z: 2.7, rot: Math.PI, collideW: 1.651, collideD: 2.21, fresh: true },
  { productId: "shawburn-chest", x: 14.5, z: 3.6, rot: Math.PI, collideW: 1.067, collideD: 0.457, fresh: true },
  { productId: "lyncott-table", x: -15.15, z: -7.9, rot: 0, collideW: 1.829, collideD: 1.016, fresh: true },
  { productId: "lyncott-chair", x: -15.65, z: -7.04, rot: Math.PI, collideW: 0.483, collideD: 0.584, fresh: true },
  { productId: "lyncott-chair", x: -14.65, z: -7.04, rot: Math.PI, collideW: 0.483, collideD: 0.584, fresh: true },
  { productId: "lyncott-chair", x: -15.65, z: -8.76, rot: 0, collideW: 0.483, collideD: 0.584, fresh: true },
  { productId: "lyncott-chair", x: -14.65, z: -8.76, rot: 0, collideW: 0.483, collideD: 0.584, fresh: true },
  { productId: "valebeck-counter", x: -22.2, z: -1.6, rot: 0, collideW: 1.219, collideD: 0.61, fresh: true },
  { productId: "valebeck-stool", x: -22.55, z: -0.95, rot: Math.PI, collideW: 0.4, collideD: 0.4, fresh: true },
  { productId: "valebeck-stool", x: -21.85, z: -0.95, rot: Math.PI, collideW: 0.4, collideD: 0.4, fresh: true },
  { productId: "bolanburg-pantry", x: -23.4, z: -19.72, rot: 0, collideW: 1.219, collideD: 0.457, fresh: true },
  { productId: "carlyle-file", x: 25.7, z: -18.3, rot: -Math.PI / 2, collideW: 0.914, collideD: 0.508, fresh: true },
  { productId: "fortville-bookcase", x: 24.3, z: 3.62, rot: Math.PI, collideW: 0.813, collideD: 0.381, fresh: true },
  { productId: "paradise-chair", x: -9.69, z: -29.55, rot: 0, collideW: 0.787, collideD: 0.838, fresh: true },
  { productId: "paradise-chair", x: -4.84, z: -29.55, rot: 0, collideW: 0.787, collideD: 0.838, fresh: true },
  { productId: "paradise-chair", x: 0, z: -29.55, rot: 0, collideW: 0.787, collideD: 0.838, fresh: true },
  { productId: "paradise-ottoman", x: -9.69, z: -28.7, rot: 0, collideW: 0.635, collideD: 0.559, fresh: true },
  { productId: "paradise-ottoman", x: -4.84, z: -28.7, rot: 0, collideW: 0.635, collideD: 0.559, fresh: true },
  { productId: "paradise-ottoman", x: 0, z: -28.7, rot: 0, collideW: 0.635, collideD: 0.559, fresh: true },
  // Lobby right side, across the Gerridan table from the Darcy sofa. Front (+Z) points south.
  { productId: "maverick-rocker", x: 7.4, z: 12.83, rot: Math.PI, collideW: 0.711, collideD: 0.914, fresh: true },
];

const ROOM_FILE: Record<RoomId, string> = {
  lot: "showroom/living.jpg",
  lobby: "showroom/living.jpg",
  living: "showroom/living.jpg",
  bedroom: "showroom/bedroom.jpg",
  dining: "showroom/dining.jpg",
  sleep: "showroom/bedroom.jpg",
  patio: "showroom/patio.jpg",
  kitchen: "showroom/dining.jpg",
  office: "showroom/living.jpg",
  kids: "showroom/bedroom.jpg",
};

export function roomArt(room: RoomId) {
  return assetUrl(ROOM_FILE[room]);
}

export function productImage(id: string) {
  return assetUrl(`products/${id}.jpg`);
}

export function roomAt(x: number, z: number): RoomId {
  if (z > 16.3) return "lot";
  if (z < -20) return "patio";
  if (z > 4) return "lobby";
  if (x < -18.2) return "kitchen";
  if (x > 18.2) return z > -4 ? "kids" : "office";
  if (z > -4) return x < 0 ? "living" : "bedroom";
  return x < 0 ? "dining" : "sleep";
}

/** Stand in front of a placed piece (local +Z). */
export function standNear(p: Placement): [number, number] {
  return [p.x + Math.sin(p.rot) * 2.35, p.z + Math.cos(p.rot) * 2.35];
}

export function firstPlacement(productId: string) {
  return PLACEMENTS.find((p) => p.productId === productId);
}
