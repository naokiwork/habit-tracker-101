import { useState } from 'react'
import { Share2, Copy, Check, QrCode, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { generateShareLink, generateShareLinkForHabits, copyToClipboard, generateQRCodeDataURL } from '@/utils/social-sharing'
import type { Habit } from '@/types/habit'

interface ShareDialogProps {
  habit?: Habit
  habits?: Habit[]
  trigger?: React.ReactNode
}

export function ShareDialog({ habit, habits, trigger }: ShareDialogProps) {
  const [shareLink, setShareLink] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const { toast } = useToast()

  const handleShare = () => {
    let link: string
    if (habits && habits.length > 0) {
      const result = generateShareLinkForHabits(habits)
      link = result.url
    } else if (habit) {
      const result = generateShareLink(habit)
      link = result.url
    } else {
      toast({
        title: 'Error',
        description: 'No habit selected for sharing',
        variant: 'destructive',
      })
      return
    }

    setShareLink(link)
  }

  const handleCopy = async () => {
    if (!shareLink) {
      handleShare()
      return
    }

    const success = await copyToClipboard(shareLink)
    if (success) {
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const qrCodeUrl = shareLink ? generateQRCodeDataURL(shareLink) : ''

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {habit ? `Share "${habit.name}"` : habits ? `Share ${habits.length} Habits` : 'Share Habit'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!shareLink && (
            <Button onClick={handleShare} className="w-full gap-2">
              <Share2 className="w-4 h-4" />
              Generate Share Link
            </Button>
          )}

          {shareLink && (
            <>
              <div className="space-y-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowQR(!showQR)}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {showQR ? 'Hide' : 'Show'} QR Code
                </Button>
                <Button
                  onClick={() => window.open(shareLink, '_blank')}
                  variant="outline"
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </Button>
              </div>

              {showQR && qrCodeUrl && (
                <div className="flex justify-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Anyone with this link can import {habit ? 'this habit' : 'these habits'} into their HabitGrid.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

