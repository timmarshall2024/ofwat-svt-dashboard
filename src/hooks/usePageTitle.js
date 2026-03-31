import { useEffect } from 'react'

const SUFFIX = ' | Ofwat Regulatory Intelligence'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title + SUFFIX
    return () => { document.title = 'Ofwat Regulatory Intelligence' }
  }, [title])
}
