import { useState, useEffect } from 'react'
import { Trophy, Star, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getUserProgress,
  createChallenge,
} from '@/utils/gamification'
import type { UserProgress } from '@/types/challenge'
import type { Habit } from '@/types/habit'

interface GamificationPanelProps {
  habits: Habit[]
}

export function GamificationPanel({ habits }: GamificationPanelProps) {
  const [progress, setProgress] = useState<UserProgress>(getUserProgress())
  const [newChallengeName, setNewChallengeName] = useState('')
  const [newChallengeTarget, setNewChallengeTarget] = useState(7)

  useEffect(() => {
    setProgress(getUserProgress())
  }, [])

  const experienceForNextLevel = (level: number) => {
    return Math.pow(level, 2) * 100
  }

  const currentLevelExp = experienceForNextLevel(progress.level - 1)
  const nextLevelExp = experienceForNextLevel(progress.level)
  const progressToNextLevel = ((progress.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100

  const handleCreateChallenge = () => {
    if (!newChallengeName || newChallengeTarget <= 0) return

    createChallenge({
      name: newChallengeName,
      type: 'custom',
      target: newChallengeTarget,
      startDate: new Date().toISOString(),
      habitIds: habits.map(h => h.id),
    })

    setProgress(getUserProgress())
    setNewChallengeName('')
    setNewChallengeTarget(7)
  }

  return (
    <Tabs defaultValue="progress" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="badges">Badges</TabsTrigger>
        <TabsTrigger value="challenges">Challenges</TabsTrigger>
      </TabsList>

      <TabsContent value="progress" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Level {progress.level}
            </CardTitle>
            <CardDescription>
              {progress.experience} XP · {progress.points} Points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {progress.level + 1}</span>
                <span>{Math.round(progressToNextLevel)}%</span>
              </div>
              <Progress value={Math.min(progressToNextLevel, 100)} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress.experience}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Total XP</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-500" />
                Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress.points}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Total Points</div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="badges" className="space-y-4">
        {progress.badges.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
                No badges unlocked yet. Keep completing habits to earn badges!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {progress.badges.map((badge) => (
              <Card key={badge.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <CardTitle className="text-base">{badge.name}</CardTitle>
                  <CardDescription className="text-xs">{badge.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge
                    className={
                      badge.rarity === 'legendary'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : badge.rarity === 'epic'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : badge.rarity === 'rare'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }
                  >
                    {badge.rarity}
                  </Badge>
                  {badge.unlockedAt && (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                      Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="challenges" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Challenge</CardTitle>
            <CardDescription>Set a custom challenge for yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Challenge Name</label>
              <input
                type="text"
                value={newChallengeName}
                onChange={(e) => setNewChallengeName(e.target.value)}
                placeholder="e.g., 30-Day Challenge"
                className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Target (days)</label>
              <input
                type="number"
                value={newChallengeTarget}
                onChange={(e) => setNewChallengeTarget(parseInt(e.target.value) || 7)}
                min="1"
                className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleCreateChallenge}
              className="w-full px-4 py-2 bg-[#0071E3] text-white rounded-lg hover:bg-[#0077ED] transition-colors"
            >
              Create Challenge
            </button>
          </CardContent>
        </Card>

        {progress.challenges.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
                No active challenges. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {progress.challenges.map((challenge) => {
              const progressPercent = (challenge.completed / challenge.target) * 100
              return (
                <Card key={challenge.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {challenge.name}
                    </CardTitle>
                    <CardDescription>
                      {challenge.completed} / {challenge.target} completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={Math.min(progressPercent, 100)} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

