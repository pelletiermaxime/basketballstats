<script setup lang="ts">
import { api } from '@convex/_generated/api'

const currentYear = 2026

// Get player stats (sorted by points descending by default)
const { data: playerStats } = await useConvexQuery(
  api.playerStats.getTopPlayerStatsWithTeams,
  { year: currentYear, limit: 100 }
)

definePageMeta({
  title: 'NBA Player Statistics'
})
</script>

<template>
  <div class="min-h-svh bg-gray-50 dark:bg-gray-950">
    <!-- Header Section -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          NBA Player Statistics
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          2025-26 Regular Season
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Table -->
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <PlayerStatsTable :stats="playerStats || []" />
      </div>
    </div>
  </div>
</template>
