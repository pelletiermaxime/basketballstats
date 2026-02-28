import { query } from "./_generated/server";

export const getTeams = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    return teams;
  },
});

export const getTeamsByConference = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    const teamsByConference: Record<string, typeof teams> = {};

    for (const team of teams) {
      if (!teamsByConference[team.conference]) {
        teamsByConference[team.conference] = [];
      }
      teamsByConference[team.conference]!.push(team);
    }

    return teamsByConference;
  },
});
