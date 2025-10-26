"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AccountSetupProps {
  formData: any
  onUpdateData: (updates: any) => void
}

export function AccountSetup({ formData, onUpdateData }: AccountSetupProps) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Let's start with your basic information</p>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => onUpdateData({ fullName: e.target.value })}
          className="bg-input border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => onUpdateData({ email: e.target.value })}
          className="bg-input border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company Name</Label>
        <Input
          id="company"
          placeholder="Your Company"
          value={formData.company}
          onChange={(e) => onUpdateData({ company: e.target.value })}
          className="bg-input border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Your Role</Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => onUpdateData({ role: e.target.value })}
          className="w-full px-3 py-2 bg-input border border-border/50 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select your role</option>
          <option value="founder">Founder</option>
          <option value="marketing-manager">Marketing Manager</option>
          <option value="content-creator">Content Creator</option>
          <option value="social-media-manager">Social Media Manager</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  )
}
