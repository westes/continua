// Temporal-cycle occurrence resolution: given a date, which temporal-id
// applies (season, proper Sunday/feria), by combining two offset systems —
// data/calendar/easter-offsets.yml (Septuagesima through Trinitytide) and
// data/calendar/fixed-date-calendar.yml (Christmas, Epiphany). Also where
// the Advent-start and Epiphanytide-length wrinkles noted in
// fixed-date-calendar.yml get arbitrated. Depends on calendar/easter.ts for
// the Easter date itself. Unused until milestone 4.
export {};
