// User and Profile types
export interface User {
  id: string;
  phone_number: string;
  created_at: string;
  profile_completed: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  photo_url?: string;
  questionnaire_data: QuestionnaireData;
  ai_analysis?: AIAnalysis;
  created_at: string;
}

// Questionnaire types
export interface QuestionnaireData {
  // Relationship Intent (Deal-breaker level)
  relationship_intent: 'casual' | 'serious' | 'marriage';
  want_children: 'yes' | 'no' | 'maybe' | 'have_them';
  
  // Lifestyle Compatibility (High weight)
  social_energy: 'parties' | 'small_groups' | 'quiet_nights';
  adventure_level: 'spontaneous' | 'planned' | 'homebody';
  
  // Values & Beliefs (High weight)
  important_values: string[]; // ['family', 'career', 'personal_growth', 'fun']
  political_alignment: 'very_important' | 'somewhat' | 'not_important';
  
  // Personal Traits (Medium weight)
  humor_style: 'witty' | 'goofy' | 'dry';
  conflict_style: 'direct' | 'need_time' | 'avoid';
  
  // Lifestyle Preferences (Medium weight)
  ideal_weekend: string[]; // ['outdoor', 'cultural', 'home_projects', 'social']
  exercise_routine: 'daily_gym' | 'occasional_hikes' | 'sports' | 'not_my_thing';
}

// AI Analysis types
export interface AIAnalysis {
  photo_score: number;
  personality_score: number;
  values_score: number;
  lifestyle_score: number;
  overall_attractiveness: number;
  personality_traits: string[];
  deal_breakers: string[];
}

// Matching types
export interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  compatibility_score: number;
  created_at: string;
  status: 'pending' | 'active' | 'archived';
  expires_at?: string;
}

export interface CompatibilityScore {
  dealBreakers: number;      // 0 or 100 (binary)
  valuesAlignment: number;   // 0-100
  personalityFit: number;    // 0-100
  lifestyleMatch: number;    // 0-100
  interestOverlap: number;   // 0-100
  photoCompatibility: number; // 0-100
  totalScore: number;        // Final weighted score
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: 'match_found' | 'profile_viewed' | 'reminder' | 'message_received';
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed';
  data?: any;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  sms_notifications: boolean;
  new_matches: boolean;
  profile_views: boolean;
  messages: boolean;
  activity_reminders: boolean;
  quiet_hours_start?: string; // '22:00'
  quiet_hours_end?: string;   // '08:00'
  timezone?: string;          // 'America/New_York'
  created_at: string;
  updated_at: string;
}

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

// Form types
export interface PhoneAuthForm {
  phone_number: string;
  verification_code?: string;
}

export interface ProfileSetupForm {
  photo: File | null;
  questionnaire: QuestionnaireData;
} 