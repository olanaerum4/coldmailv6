export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type LeadStatus = 'pending' | 'active' | 'replied' | 'bounced' | 'unsubscribed'
export type InterestStatus = 'interested' | 'not_interested' | 'wrong_contact'

export interface Campaign {
  id: string
  name: string
  from_email: string
  from_name: string
  status: CampaignStatus
  created_at: string
}

export interface Sequence {
  id: string
  campaign_id: string
  step_number: number
  delay_days: number
  subject: string
  body: string
  created_at: string
}

export interface Lead {
  id: string
  campaign_id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  status: LeadStatus
  current_step: number
  created_at: string
}

export interface EmailSent {
  id: string
  lead_id: string
  sequence_id: string
  campaign_id: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  open_count: number
  click_count: number
}

export interface InboxMessage {
  id: string
  lead_id: string | null
  email_sent_id: string | null
  from_email: string
  from_name: string | null
  subject: string | null
  body: string | null
  received_at: string
  interest_status: InterestStatus | null
  read: boolean
}

export interface CampaignStats {
  campaign_id: string
  name: string
  status: CampaignStatus
  total_leads: number
  replied_leads: number
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  emails_replied: number
}
