import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Example table - you can customize for basketball stats
  teams: defineTable({
    name: v.string(),
    city: v.string(),
    abbreviation: v.string(),
    conference: v.string(),
    division: v.string(),
  })
    .index("abbreviation", ["abbreviation"])
    .index("conference", ["conference"]),

  players: defineTable({
    name: v.string(),
    teamId: v.optional(v.id("teams")),
    position: v.string(),
    number: v.optional(v.number()),
  })
    .index("teamId", ["teamId"]),
});
