import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StatsWidgetProps {
  id: string
  title: string
  content: ReactNode
  size?: 'small' | 'medium' | 'large'
  onRemove?: (id: string) => void
  draggable?: boolean
}

export function StatsWidget({ id, title, content, size = 'medium', onRemove, draggable = false }: StatsWidgetProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
  }

  return (
    <Card className={`${sizeClasses[size]} relative group`}>
      {draggable && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

