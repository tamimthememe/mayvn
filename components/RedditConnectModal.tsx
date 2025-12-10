"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/contexts/BrandContext'
import { toast } from 'sonner'
import { updateBrandDocument } from '@/lib/userService'

interface RedditConnectModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function RedditConnectModal({ isOpen, onClose, onSuccess }: RedditConnectModalProps) {
    const { user } = useAuth()
    const { selectedBrandId, refreshBrands } = useBrand()
    const [step, setStep] = useState<'input' | 'verify' | 'success'>('input')
    const [username, setUsername] = useState('')
    const [challenge, setChallenge] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const handleGenerateChallenge = async () => {
        if (!username.trim()) {
            setError('Please enter your Reddit username')
            return
        }
        if (!user?.uid || !selectedBrandId) {
            setError('You must be logged in and have a brand selected')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            // 1. Get challenge string from API
            const res = await fetch('/api/reddit/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // 2. Save to DB (Brand-specific)
            await updateBrandDocument(user.uid, selectedBrandId, { redditChallenge: data.challenge })
            await refreshBrands()

            setChallenge(data.challenge)
            setStep('verify')
        } catch (err: any) {
            setError(err.message || 'Failed to generate challenge')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async () => {
        setIsLoading(true)
        setError('')

        try {
            // 1. Verify via API (Stateless check)
            const res = await fetch('/api/reddit/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    redditUsername: username,
                    challenge: challenge
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // 2. Update DB (Brand-specific)
            if (user?.uid && selectedBrandId) {
                await updateBrandDocument(user.uid, selectedBrandId, {
                    redditUsername: username,
                    isRedditVerified: true
                })
                await refreshBrands()
            }

            setStep('success')
            setTimeout(() => {
                onSuccess?.()
                onClose()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Verification failed. Did you update your bio?')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(challenge)
        setCopied(true)
        toast.success("Code copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#0a0a0a] border-[#2a2a2a] text-white z-[100]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="bg-[#FF4500] p-1 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">R</span>
                        Connect Reddit Account
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Verify ownership of your Reddit account to track analytics.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'input' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Reddit Username</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">u/</span>
                                    <Input
                                        id="username"
                                        placeholder="username"
                                        className="pl-8 bg-[#1a1a1a] border-[#2a2a2a]"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleGenerateChallenge}
                                className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Continue
                            </Button>
                        </div>
                    )}

                    {step === 'verify' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>1. Copy your verification code</Label>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] font-sans text-lg font-bold tracking-widest text-center text-[#FF4500] select-all">
                                        {challenge}
                                    </code>
                                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <div className="text-center">
                                    <button
                                        onClick={() => setStep('input')}
                                        className="text-xs text-gray-500 hover:text-white underline"
                                    >
                                        Wrong username? Change it
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>2. Paste into your Reddit Bio</Label>
                                <p className="text-xs text-gray-400">
                                    Go to your Reddit profile settings and add the code to your "About" (Bio) section.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-[#FF4500]" onClick={() => window.open('https://www.reddit.com/settings/profile', '_blank')}>
                                    Open Reddit Settings <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                            </div>

                            <Button
                                onClick={handleVerify}
                                className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                I've Updated My Bio
                            </Button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Connected!</h3>
                                <p className="text-sm text-gray-400">Your Reddit account has been verified.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
