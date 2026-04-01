import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.error('ErrorBoundary caught:', error, errorInfo?.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-fs-md border border-fs-border bg-fs-surface p-8 text-center my-8">
          <h2 className="text-lg font-heading font-bold text-fs-text mb-2">
            This section couldn't load
          </h2>
          <p className="text-sm text-fs-text-muted mb-4">
            Please refresh or contact Fox Stephens.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-fs-sm bg-fs-primary text-white px-4 py-2 text-sm font-medium hover:bg-fs-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
