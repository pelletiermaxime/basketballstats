import { internalMutation } from './_generated/server'

interface NbaTeamSeed {
  city: string
  name: string
  abbreviation: string
  conference: 'East' | 'West'
  division: string
  nbaApiId: number
}

const nbaTeams: NbaTeamSeed[] = [
  {
    city: 'Atlanta',
    name: 'Hawks',
    abbreviation: 'ATL',
    conference: 'East',
    division: 'Southeast',
    nbaApiId: 1610612737,
  },
  {
    city: 'Boston',
    name: 'Celtics',
    abbreviation: 'BOS',
    conference: 'East',
    division: 'Atlantic',
    nbaApiId: 1610612738,
  },
  {
    city: 'Brooklyn',
    name: 'Nets',
    abbreviation: 'BKN',
    conference: 'East',
    division: 'Atlantic',
    nbaApiId: 1610612751,
  },
  {
    city: 'Charlotte',
    name: 'Hornets',
    abbreviation: 'CHA',
    conference: 'East',
    division: 'Southeast',
    nbaApiId: 1610612766,
  },
  {
    city: 'Chicago',
    name: 'Bulls',
    abbreviation: 'CHI',
    conference: 'East',
    division: 'Central',
    nbaApiId: 1610612741,
  },
  {
    city: 'Cleveland',
    name: 'Cavaliers',
    abbreviation: 'CLE',
    conference: 'East',
    division: 'Central',
    nbaApiId: 1610612739,
  },
  {
    city: 'Dallas',
    name: 'Mavericks',
    abbreviation: 'DAL',
    conference: 'West',
    division: 'Southwest',
    nbaApiId: 1610612742,
  },
  {
    city: 'Denver',
    name: 'Nuggets',
    abbreviation: 'DEN',
    conference: 'West',
    division: 'Northwest',
    nbaApiId: 1610612743,
  },
  {
    city: 'Detroit',
    name: 'Pistons',
    abbreviation: 'DET',
    conference: 'East',
    division: 'Central',
    nbaApiId: 1610612765,
  },
  {
    city: 'Golden State',
    name: 'Warriors',
    abbreviation: 'GSW',
    conference: 'West',
    division: 'Pacific',
    nbaApiId: 1610612744,
  },
  {
    city: 'Houston',
    name: 'Rockets',
    abbreviation: 'HOU',
    conference: 'West',
    division: 'Southwest',
    nbaApiId: 1610612745,
  },
  {
    city: 'Indiana',
    name: 'Pacers',
    abbreviation: 'IND',
    conference: 'East',
    division: 'Central',
    nbaApiId: 1610612754,
  },
  {
    city: 'LA',
    name: 'Clippers',
    abbreviation: 'LAC',
    conference: 'West',
    division: 'Pacific',
    nbaApiId: 1610612746,
  },
  {
    city: 'Los Angeles',
    name: 'Lakers',
    abbreviation: 'LAL',
    conference: 'West',
    division: 'Pacific',
    nbaApiId: 1610612747,
  },
  {
    city: 'Memphis',
    name: 'Grizzlies',
    abbreviation: 'MEM',
    conference: 'West',
    division: 'Southwest',
    nbaApiId: 1610612763,
  },
  {
    city: 'Miami',
    name: 'Heat',
    abbreviation: 'MIA',
    conference: 'East',
    division: 'Southeast',
    nbaApiId: 1610612748,
  },
  {
    city: 'Milwaukee',
    name: 'Bucks',
    abbreviation: 'MIL',
    conference: 'East',
    division: 'Central',
    nbaApiId: 1610612749,
  },
  {
    city: 'Minnesota',
    name: 'Timberwolves',
    abbreviation: 'MIN',
    conference: 'West',
    division: 'Northwest',
    nbaApiId: 1610612750,
  },
  {
    city: 'New Orleans',
    name: 'Pelicans',
    abbreviation: 'NOP',
    conference: 'West',
    division: 'Southwest',
    nbaApiId: 1610612740,
  },
  {
    city: 'New York',
    name: 'Knicks',
    abbreviation: 'NYK',
    conference: 'East',
    division: 'Atlantic',
    nbaApiId: 1610612752,
  },
  {
    city: 'Oklahoma City',
    name: 'Thunder',
    abbreviation: 'OKC',
    conference: 'West',
    division: 'Northwest',
    nbaApiId: 1610612760,
  },
  {
    city: 'Orlando',
    name: 'Magic',
    abbreviation: 'ORL',
    conference: 'East',
    division: 'Southeast',
    nbaApiId: 1610612753,
  },
  {
    city: 'Philadelphia',
    name: '76ers',
    abbreviation: 'PHI',
    conference: 'East',
    division: 'Atlantic',
    nbaApiId: 1610612755,
  },
  {
    city: 'Phoenix',
    name: 'Suns',
    abbreviation: 'PHX',
    conference: 'West',
    division: 'Pacific',
    nbaApiId: 1610612756,
  },
  {
    city: 'Portland',
    name: 'Trail Blazers',
    abbreviation: 'POR',
    conference: 'West',
    division: 'Northwest',
    nbaApiId: 1610612757,
  },
  {
    city: 'Sacramento',
    name: 'Kings',
    abbreviation: 'SAC',
    conference: 'West',
    division: 'Pacific',
    nbaApiId: 1610612758,
  },
  {
    city: 'San Antonio',
    name: 'Spurs',
    abbreviation: 'SAS',
    conference: 'West',
    division: 'Southwest',
    nbaApiId: 1610612759,
  },
  {
    city: 'Toronto',
    name: 'Raptors',
    abbreviation: 'TOR',
    conference: 'East',
    division: 'Atlantic',
    nbaApiId: 1610612761,
  },
  {
    city: 'Utah',
    name: 'Jazz',
    abbreviation: 'UTA',
    conference: 'West',
    division: 'Northwest',
    nbaApiId: 1610612762,
  },
  {
    city: 'Washington',
    name: 'Wizards',
    abbreviation: 'WAS',
    conference: 'East',
    division: 'Southeast',
    nbaApiId: 1610612764,
  },
]

export const seedTeams = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingTeams = await ctx.db.query('teams').collect()
    if (existingTeams.length > 0) {
      return { count: existingTeams.length, skipped: true }
    }

    let count = 0
    for (const team of nbaTeams) {
      await ctx.db.insert('teams', team)
      count++
    }

    return { count, skipped: false }
  },
})
