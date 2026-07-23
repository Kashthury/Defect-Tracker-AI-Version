import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface DashboardSectionBoundaryProps {
  name: string
  resetKey: string
  children: React.ReactNode
}

interface DashboardSectionBoundaryState {
  failed: boolean
}

/**
 * Keeps an unexpected analytics payload/rendering error isolated to one
 * dashboard section instead of unmounting the entire Project dashboard.
 */
export class DashboardSectionBoundary extends React.Component<DashboardSectionBoundaryProps, DashboardSectionBoundaryState> {
  state: DashboardSectionBoundaryState = { failed: false }

  static getDerivedStateFromError(): DashboardSectionBoundaryState {
    return { failed: true }
  }

  componentDidUpdate(previousProps: DashboardSectionBoundaryProps) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-ink-800">{this.props.name} is unavailable</p>
            <p className="mt-1 text-xs text-ink-600">The remaining Project dashboard is still available. Refresh to try loading this section again.</p>
          </div>
        </div>
      </div>
    )
  }
}
