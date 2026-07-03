import { useState } from 'react'
import html2canvas from 'html2canvas'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportTierListButtonProps {
  elementId: string
  fileName: string
}

export function ExportTierListButton({ elementId, fileName }: ExportTierListButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    const element = document.getElementById(elementId)
    if (!element) return

    setIsExporting(true)
    try {
      // Small delay to ensure styles are applied if they dynamically changed
      await new Promise(r => setTimeout(r, 100))

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // High resolution
        backgroundColor: document.body.style.backgroundColor || '#0f0f1a', // Match theme
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = fileName
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Export failed:', e)
      alert('Export se nezdařil. Zkuste to prosím znovu.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={isExporting}
      id="export-btn"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">{isExporting ? 'Generování...' : 'Export (PNG)'}</span>
    </Button>
  )
}
