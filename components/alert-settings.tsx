"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, BellOff, Mail, Phone, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, Zap, Settings, Info } from "lucide-react"
import { AlertConfig, CARRIER_LABELS, CarrierKey } from "@/lib/alert-types"
const CARRIERS = Object.entries(CARRIER_LABELS) as [CarrierKey, string][]

const THRESHOLD_LABELS: Record<string, { label: string; description: string; emoji: string }> = {
  newBuySignal:  { label: "New BUY Signal",     description: "Alert when any game crosses the EV buy threshold",         emoji: "🟢" },
  peakGinther:   { label: "Peak Ginther (20x+)", description: "Alert when Ginther Ratio crosses 20× (prizes vanishing)", emoji: "🔥" },
  lastPrize:     { label: "Last Top Prize",      description: "Alert when only 1 top prize remains unclaimed",           emoji: "⚡" },
  evPositive:    { label: "EV Turns Positive",   description: "Alert when expected value flips above $0",                emoji: "📈" },
  prizeCleared:  { label: "Prize Claimed",       description: "Alert when a BUY game has its top prize claimed",         emoji: "💀" },
  dailyDigest:   { label: "Daily Digest",        description: "Morning summary of all notable games across states",      emoji: "📊" },
}

interface TestResult {
  email: boolean
  sms: boolean
  errors: string[]
}

export function AlertSettings() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [pwEditing, setPwEditing] = useState(false)

  useEffect(() => {
    if (open && !config) loadConfig()
  }, [open])

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await fetch("/api/alerts/config")
      const data = await res.json()
      if (data.success) setConfig(data.config)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  function patch(updates: Partial<AlertConfig>) {
    setConfig(prev => prev ? { ...prev, ...updates } : prev)
  }

  async function save() {
    if (!config) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const payload = { ...config }
      if (!pwEditing) payload.gmailAppPassword = "••••••••••••••••"
      const res = await fetch("/api/alerts/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) {
        setSaveMsg("✅ Settings saved!")
        setConfig(data.config)
        setPwEditing(false)
      } else {
        setSaveMsg("❌ " + (data.error ?? "Save failed"))
      }
    } catch (e) {
      setSaveMsg("❌ Network error")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  async function sendTest() {
    if (!config) return
    // Save first, then test
    await save()
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/alerts/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true }) })
      const data = await res.json()
      if (data.success && data.result) {
        setTestResult({ email: data.result.email, sms: data.result.sms, errors: data.result.errors })
      } else {
        setTestResult({ email: false, sms: false, errors: [data.error ?? "Unknown error"] })
      }
    } catch {
      setTestResult({ email: false, sms: false, errors: ["Network error"] })
    } finally {
      setTesting(false)
    }
  }

  async function runCheck() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/alerts/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      const data = await res.json()
      const summary = data.states?.map((s: { state: string; alertsSent?: number; triggers?: string[] }) => `${s.state}: ${s.alertsSent ?? 0} alerts`).join(", ") ?? "No data"
      setSaveMsg(`✅ Check complete — ${summary}`)
    } catch {
      setSaveMsg("❌ Check failed")
    } finally {
      setTesting(false)
      setTimeout(() => setSaveMsg(null), 5000)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700 mb-6">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-yellow-400" />
            <span>BUY NOW Alert System</span>
            {config?.enabled ? (
              <Badge className="bg-green-600 text-white text-xs">ACTIVE</Badge>
            ) : (
              <Badge className="bg-gray-600 text-white text-xs">OFF</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs">SMS + Email alerts when EV flips</span>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5">
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading settings...
            </div>
          )}

          {!loading && config && (
            <>
              {/* Master enable toggle */}
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div>
                  <div className="text-white font-medium flex items-center gap-2">
                    {config.enabled ? <Bell className="h-4 w-4 text-green-400" /> : <BellOff className="h-4 w-4 text-gray-400" />}
                    Alert System {config.enabled ? "Enabled" : "Disabled"}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">Toggle to activate real-time BUY alerts</div>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={v => patch({ enabled: v })}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <Separator className="bg-gray-700" />

              {/* Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Mail className="h-4 w-4 text-blue-400" />
                  Email Settings
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Gmail Account (sends FROM)</Label>
                    <Input
                      value={config.gmailUser}
                      onChange={e => patch({ gmailUser: e.target.value })}
                      placeholder="yourname@gmail.com"
                      className="bg-gray-800 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">
                      Gmail App Password{" "}
                      <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                        (get one here)
                      </a>
                    </Label>
                    {pwEditing ? (
                      <Input
                        type="password"
                        value={config.gmailAppPassword}
                        onChange={e => patch({ gmailAppPassword: e.target.value })}
                        placeholder="xxxx xxxx xxxx xxxx"
                        className="bg-gray-800 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={config.gmailAppPassword ? "••••••••••••••••" : ""}
                          readOnly
                          placeholder="Not set"
                          className="bg-gray-800 border-gray-600 text-gray-400 text-sm"
                        />
                        <Button variant="outline" size="sm" onClick={() => setPwEditing(true)} className="border-gray-600 text-gray-300 hover:text-white whitespace-nowrap text-xs">
                          Change
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Alert Email Address (sends TO)</Label>
                  <Input
                    value={config.email}
                    onChange={e => patch({ email: e.target.value })}
                    placeholder="youremail@example.com"
                    className="bg-gray-800 border-gray-600 text-white text-sm max-w-xs"
                  />
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* SMS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Phone className="h-4 w-4 text-green-400" />
                  Free SMS (via carrier email gateway — no Twilio!)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Cell Phone Number (10 digits)</Label>
                    <Input
                      value={config.phone}
                      onChange={e => patch({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="5415551234"
                      className="bg-gray-800 border-gray-600 text-white text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Carrier</Label>
                    <Select value={config.carrier} onValueChange={(v: CarrierKey) => patch({ carrier: v })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {CARRIERS.map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <span>SMS is sent free by emailing your carrier&apos;s gateway address. No account needed. Most carriers support it natively.</span>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Thresholds */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Alert Triggers
                </div>
                <div className="space-y-2">
                  {Object.entries(THRESHOLD_LABELS).map(([key, meta]) => (
                    <div key={key} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2.5">
                      <div>
                        <div className="text-white text-sm">{meta.emoji} {meta.label}</div>
                        <div className="text-gray-400 text-xs">{meta.description}</div>
                      </div>
                      <Switch
                        checked={config.thresholds[key as keyof typeof config.thresholds]}
                        onCheckedChange={v => patch({ thresholds: { ...config.thresholds, [key]: v } })}
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* States */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Settings className="h-4 w-4 text-purple-400" />
                  Monitor States
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2.5 flex-1">
                    <div className="text-white text-sm">🌲 Oregon</div>
                    <Switch
                      checked={config.states.oregon}
                      onCheckedChange={v => patch({ states: { ...config.states, oregon: v } })}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2.5 flex-1">
                    <div className="text-white text-sm">🌴 California</div>
                    <Switch
                      checked={config.states.california}
                      onCheckedChange={v => patch({ states: { ...config.states, california: v } })}
                      className="data-[state=checked]:bg-yellow-500"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Test result */}
              {testResult && (
                <Alert className={testResult.errors.length === 0 ? "bg-green-900/30 border-green-700" : "bg-red-900/30 border-red-700"}>
                  <div className="flex items-center gap-2">
                    {testResult.errors.length === 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                    <AlertTitle className="text-white text-sm">
                      {testResult.errors.length === 0 ? "Test sent!" : "Test had errors"}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="text-xs text-gray-300 mt-1 space-y-0.5">
                    <div>Email: {testResult.email ? "✅ Delivered" : "❌ Failed"}</div>
                    <div>SMS: {testResult.sms ? "✅ Delivered" : "❌ Failed"}</div>
                    {testResult.errors.map((e, i) => <div key={i} className="text-red-400">{e}</div>)}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={save}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving...</> : "💾 Save Settings"}
                </Button>

                <Button
                  onClick={sendTest}
                  disabled={testing || saving}
                  variant="outline"
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30 text-sm"
                >
                  {testing ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Testing...</> : "🧪 Send Test Alert"}
                </Button>

                <Button
                  onClick={runCheck}
                  disabled={testing || saving}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-900/30 text-sm"
                >
                  {testing ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Checking...</> : "⚡ Run Alert Check Now"}
                </Button>

                {saveMsg && (
                  <span className={`text-sm ${saveMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                    {saveMsg}
                  </span>
                )}
              </div>

              {/* Setup help */}
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <div className="text-gray-300 font-medium mb-1.5">📋 Gmail App Password Setup (one-time)</div>
                <div>1. Go to <a href="https://myaccount.google.com/security" target="_blank" className="text-blue-400 underline">myaccount.google.com/security</a> → enable 2FA</div>
                <div>2. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-blue-400 underline">myaccount.google.com/apppasswords</a></div>
                <div>3. Create app → name it &quot;SCRAPGER&quot; → copy the 16-char password</div>
                <div>4. Paste it above (spaces OK — Gmail ignores them)</div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
