"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useBrand } from "@/contexts/BrandContext"
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export default function InstagramDebugPage() {
    const { user } = useAuth()
    const { selectedBrand } = useBrand()
    const [result, setResult] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const runDiagnostics = async () => {
        if (!user?.uid || !selectedBrand?.id) {
            setError('Please log in and select a brand first.')
            return
        }

        setIsLoading(true)
        setError('')
        setResult(null)

        try {
            const res = await fetch(`/api/instagram/debug?userId=${user.uid}&brandId=${selectedBrand.id}`)
            const data = await res.json()
            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Instagram Connection Diagnostics</h1>

            <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="font-medium">Current Context</p>
                        <p className="text-sm text-gray-500">User: {user?.uid || 'Not logged in'}</p>
                        <p className="text-sm text-gray-500">Brand: {selectedBrand?.brand_name || 'None selected'} ({selectedBrand?.id})</p>
                    </div>
                    <Button onClick={runDiagnostics} disabled={isLoading || !user}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Run Diagnostics
                    </Button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Token Status */}
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            Token Status
                            {result.checks?.token?.valid ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Valid:</strong> {result.checks?.token?.valid ? 'Yes' : 'No'}</p>
                            <p><strong>Scopes:</strong> {result.checks?.token?.scopes?.join(', ') || 'None'}</p>
                            <p><strong>Expires At:</strong> {result.checks?.token?.expires_at ? new Date(result.checks.token.expires_at * 1000).toLocaleString() : 'Unknown'}</p>
                            {result.checks?.token?.error && (
                                <p className="text-red-400">Error: {JSON.stringify(result.checks.token.error)}</p>
                            )}
                        </div>
                    </Card>

                    {/* Permissions Check */}
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Permissions Check</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg border ${result.checks?.conversations?.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                <p className="font-medium mb-1">Conversations (DMs)</p>
                                <p className="text-sm">Success: {result.checks?.conversations?.success ? 'Yes' : 'No'}</p>
                                {result.checks?.conversations?.error && (
                                    <p className="text-xs text-red-400 mt-1">{result.checks.conversations.error.message}</p>
                                )}
                            </div>
                            <div className={`p-4 rounded-lg border ${result.checks?.media?.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                <p className="font-medium mb-1">Media (Posts)</p>
                                <p className="text-sm">Success: {result.checks?.media?.success ? 'Yes' : 'No'}</p>
                                {result.checks?.media?.error && (
                                    <p className="text-xs text-red-400 mt-1">{result.checks.media.error.message}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Raw Output */}
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">Raw Diagnostics</h3>
                        <pre className="bg-black/50 p-4 rounded-lg overflow-auto text-xs font-mono max-h-96">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </Card>
                </div>
            )}
        </div>
    )
}
