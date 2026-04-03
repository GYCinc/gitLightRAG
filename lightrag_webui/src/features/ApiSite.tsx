import { useState, useEffect } from 'react'
import { useTabVisibility } from '@/contexts/useTabVisibility'
import { useTranslation } from 'react-i18next'
import {
  checkHealth,
  scanNewDocuments,
  reprocessFailedDocuments,
  getDocumentsScanProgress,
  clearCache,
  clearDocuments
} from '@/api/lightrag'
import { backendBaseUrl } from '@/lib/constants'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ActivityIcon, RefreshCwIcon, FileTextIcon, AlertTriangleIcon, CheckCircleIcon, TrashIcon, DatabaseIcon } from 'lucide-react'

export default function ApiSite() {
  const { t } = useTranslation()
  const { isTabVisible } = useTabVisibility()
  const isApiTabVisible = isTabVisible('api')

  const [healthStatus, setHealthStatus] = useState<string>('unknown')
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isReprocessing, setIsReprocessing] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [isClearingDocs, setIsClearingDocs] = useState(false)
  const [scanProgress, setScanProgress] = useState<{ status: string, total: number, current: number } | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Load the iframe once on component mount
  useEffect(() => {
    if (!iframeLoaded) {
      setIframeLoaded(true)
    }
  }, [iframeLoaded])

  const handleCheckHealth = async () => {
    try {
      setIsCheckingHealth(true)
      const res = await checkHealth()
      setHealthStatus(res.status)
      toast.success('Health check completed')
    } catch (err) {
      setHealthStatus('error')
      toast.error('Health check failed')
    } finally {
      setIsCheckingHealth(false)
    }
  }

  const handleScanDocuments = async () => {
    try {
      setIsScanning(true)
      await scanNewDocuments()
      toast.success('Document scan started')
      checkScanProgress()
    } catch (err) {
      toast.error('Failed to start document scan')
      setIsScanning(false)
    }
  }

  const checkScanProgress = async () => {
    try {
      const res = await getDocumentsScanProgress()
      setScanProgress({
        status: res.status,
        total: res.total_files || 0,
        current: res.processed_files || 0
      })
      if (res.status === 'scanning' || res.status === 'processing') {
        setTimeout(checkScanProgress, 2000)
      } else {
        setIsScanning(false)
      }
    } catch (err) {
      setIsScanning(false)
    }
  }

  const handleReprocessFailed = async () => {
    try {
      setIsReprocessing(true)
      await reprocessFailedDocuments()
      toast.success('Reprocessing failed documents')
    } catch (err) {
      toast.error('Failed to reprocess documents')
    } finally {
      setIsReprocessing(false)
    }
  }

  const handleClearCache = async () => {
    try {
      setIsClearingCache(true)
      await clearCache()
      toast.success('Cache cleared successfully')
    } catch (err) {
      toast.error('Failed to clear cache')
    } finally {
      setIsClearingCache(false)
    }
  }

  const handleClearDocuments = async () => {
    try {
      setIsClearingDocs(true)
      await clearDocuments()
      toast.success('Documents cleared successfully')
    } catch (err) {
      toast.error('Failed to clear documents')
    } finally {
      setIsClearingDocs(false)
    }
  }

  useEffect(() => {
    if (isApiTabVisible) {
      handleCheckHealth()
    }
  }, [isApiTabVisible])

  return (
    <div className={`size-full bg-background ${isApiTabVisible ? '' : 'hidden'} flex flex-col`}>
      <Tabs defaultValue="management" className="w-full h-full flex flex-col">
        <div className="border-b border-border px-6 py-2">
          <TabsList>
            <TabsTrigger value="management">Quick Actions</TabsTrigger>
            <TabsTrigger value="swagger">All Endpoints (Swagger)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="management" className="flex-1 overflow-auto p-6 m-0">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">API Management</h1>
              <p className="text-muted-foreground">
                Monitor and trigger common system-wide API operations.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* System Health Card */}
              <Card className="bg-card shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium text-foreground">System Health Check</CardTitle>
                    <CardDescription>Verify system API endpoints are responding correctly.</CardDescription>
                  </div>
                  <ActivityIcon className="size-5 text-primary opacity-70" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-md">
                      <span className="text-muted-foreground font-medium">Status:</span>
                      <div className="flex items-center gap-1.5">
                        {healthStatus === 'healthy' && <CheckCircleIcon className="size-4 text-emerald-500" />}
                        {healthStatus === 'error' && <AlertTriangleIcon className="size-4 text-red-500" />}
                        <span className={`font-medium ${
                          healthStatus === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' :
                          healthStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleCheckHealth}
                      disabled={isCheckingHealth}
                      className="w-full sm:w-auto"
                    >
                      {isCheckingHealth ? (
                        <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ActivityIcon className="mr-2 size-4" />
                      )}
                      Execute Health Check
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Document Scanning Card */}
              <Card className="bg-card shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium text-foreground">Document Scanning</CardTitle>
                    <CardDescription>Scan input directory for new documents to ingest.</CardDescription>
                  </div>
                  <FileTextIcon className="size-5 text-primary opacity-70" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-4">
                    {scanProgress && (scanProgress.status === 'scanning' || scanProgress.status === 'processing') && (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Scan in progress</span>
                          <span>{Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleScanDocuments}
                      disabled={isScanning || (scanProgress?.status === 'scanning')}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      {isScanning ? (
                        <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                      ) : (
                        <FileTextIcon className="mr-2 size-4" />
                      )}
                      Scan New Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reprocess Failed Documents Card */}
              <Card className="bg-card shadow-sm border-border md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium text-foreground">Reprocess Failed</CardTitle>
                    <CardDescription>Retry ingestion for documents that previously failed.</CardDescription>
                  </div>
                  <AlertTriangleIcon className="size-5 text-amber-500 opacity-70" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                    <Button
                      onClick={handleReprocessFailed}
                      disabled={isReprocessing}
                      variant="outline"
                      className="w-full text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    >
                      {isReprocessing ? (
                        <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                      ) : (
                        <RefreshCwIcon className="mr-2 size-4" />
                      )}
                      Reprocess All Failed
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Data Management Card */}
              <Card className="bg-card shadow-sm border-border md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium text-destructive">System Data Management</CardTitle>
                    <CardDescription>Destructive actions for cache and documents.</CardDescription>
                  </div>
                  <DatabaseIcon className="size-5 text-destructive opacity-70" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleClearCache}
                      disabled={isClearingCache}
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    >
                      {isClearingCache ? (
                        <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                      ) : (
                        <TrashIcon className="mr-2 size-4" />
                      )}
                      Clear Cache
                    </Button>

                    <Button
                      onClick={handleClearDocuments}
                      disabled={isClearingDocs}
                      variant="destructive"
                      className="flex-1"
                    >
                      {isClearingDocs ? (
                        <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                      ) : (
                        <TrashIcon className="mr-2 size-4" />
                      )}
                      Clear All Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swagger" className="flex-1 m-0 bg-background dark:bg-zinc-100">
          {iframeLoaded ? (
            <iframe
              src={backendBaseUrl + '/docs'}
              className="size-full w-full h-full"
              style={{ width: '100%', height: '100%', border: 'none' }}
              key="api-docs-iframe"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-background">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p>{t('apiSite.loading')}</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
