import React from 'react'
import { LucideIcon, Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'

interface PlaceholderPageProps {
  title: string
  description: string
  icon?: LucideIcon
  note?: string
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon: Icon = Construction, note }) => {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={<Icon className="h-5 w-5" />}
          title="Module scaffold ready"
          description={note ?? 'Navigation, permissions, and layout are wired up. Detailed fields for this module will be built next.'}
        />
      </Card>
    </div>
  )
}
