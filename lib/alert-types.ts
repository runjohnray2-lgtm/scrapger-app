// Client-safe types and constants (no Node.js imports)

export type CarrierKey =
  | "verizon" | "att" | "tmobile" | "sprint"
  | "boost" | "cricket" | "metropcs" | "uscellular"

export const CARRIER_LABELS: Record<CarrierKey, string> = {
  verizon:    "Verizon",
  att:        "AT&T",
  tmobile:    "T-Mobile",
  sprint:     "Sprint",
  boost:      "Boost Mobile",
  cricket:    "Cricket Wireless",
  metropcs:   "Metro PCS",
  uscellular: "US Cellular",
}

export const CARRIER_GATEWAYS: Record<CarrierKey, string> = {
  verizon:    "vtext.com",
  att:        "txt.att.net",
  tmobile:    "tmomail.net",
  sprint:     "messaging.sprintpcs.com",
  boost:      "sms.myboostmobile.com",
  cricket:    "sms.cricketwireless.net",
  metropcs:   "mymetropcs.com",
  uscellular: "email.uscc.net",
}

export interface AlertConfig {
  enabled: boolean
  email: string
  phone: string
  carrier: CarrierKey
  gmailUser: string
  gmailAppPassword: string
  thresholds: {
    newBuySignal: boolean
    peakGinther: boolean
    lastPrize: boolean
    evPositive: boolean
    prizeCleared: boolean
    dailyDigest: boolean
  }
  states: {
    oregon: boolean
    california: boolean
  }
  minGintherForDigest: number
  lastAlertSent: string | null
  lastDigestSent: string | null
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: false,
  email: "",
  phone: "",
  carrier: "verizon",
  gmailUser: "",
  gmailAppPassword: "",
  thresholds: {
    newBuySignal: true,
    peakGinther: true,
    lastPrize: true,
    evPositive: true,
    prizeCleared: true,
    dailyDigest: true,
  },
  states: { oregon: true, california: true },
  minGintherForDigest: 5,
  lastAlertSent: null,
  lastDigestSent: null,
}
