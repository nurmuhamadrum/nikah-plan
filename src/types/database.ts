export type PlanType = "WEDDING_ONLY" | "COMPLETE_PASS";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";
export type WorkspaceRole = "OWNER" | "PARTNER";
export type FundingSource = "JOINT" | "GROOM_FAMILY" | "BRIDE_FAMILY" | "ANGPAO";
export type BudgetPhase = "WEDDING" | "HONEYMOON_PRE" | "HONEYMOON_ONTRIP";
export type GiftType = "CASH" | "TRANSFER" | "PHYSICAL";
export type GiftAllocation = "UNALLOCATED" | "WEDDING_COVER" | "HONEYMOON_FUND";
export type PromoDiscountType = "PERCENT" | "FIXED";
export type InvitationTheme =
  | "BOTANICAL_SAGE"
  | "WARM_TERRACOTTA"
  | "CLASSIC_GOLD"
  | "MIDNIGHT_GARDEN";
export type RsvpAttendance = "HADIR" | "TIDAK_HADIR" | "RAGU";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  has_paid: boolean;
  is_admin: boolean;
  active_workspace_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  order_id: string;
  plan: PlanType;
  amount: number;
  promo_code: string | null;
  status: PaymentStatus;
  payment_method: string | null;
  snap_token: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Workspace = {
  id: string;
  couple_title: string;
  wedding_date: string | null;
  guest_estimate: number;
  wedding_budget_target: number;
  honeymoon_destination: string | null;
  honeymoon_start_date: string | null;
  honeymoon_end_date: string | null;
  honeymoon_currency: string;
  honeymoon_exchange_rate: number;
  honeymoon_budget_target: number;
  plan: PlanType;
  invite_code: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
};

export type BudgetCategory = {
  id: string;
  workspace_id: string;
  phase: BudgetPhase;
  name: string;
  icon: string | null;
  allocated_amount: number;
  sort_order: number;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  workspace_id: string;
  category_id: string;
  phase: BudgetPhase;
  title: string;
  vendor_contact: string | null;
  notes: string | null;
  estimated_cost: number;
  deal_cost: number;
  currency: string;
  foreign_amount: number | null;
  is_booked: boolean;
  updated_at: string;
  created_at: string;
};

export type ItemPayment = {
  id: string;
  workspace_id: string;
  item_id: string;
  label: string;
  amount: number;
  funding: FundingSource;
  due_date: string | null;
  is_paid: boolean;
  paid_date: string | null;
  receipt_url: string | null;
  updated_at: string;
  created_at: string;
};

export type WeddingGift = {
  id: string;
  workspace_id: string;
  sender_name: string;
  gift_type: GiftType;
  amount: number;
  allocated_to: GiftAllocation;
  notes: string | null;
  created_at: string;
};

export type HoneymoonChecklist = {
  id: string;
  workspace_id: string;
  title: string;
  category: string;
  is_completed: boolean;
  linked_item_id: string | null;
  sort_order: number;
  updated_at: string;
  created_at: string;
};

export type PricingPlanFeature = {
  label: string;
  included: boolean;
};

export type PricingPlanRow = {
  id: PlanType;
  name: string;
  tagline: string;
  price: number;
  original_price: number;
  badge: string | null;
  recommended: boolean;
  features: PricingPlanFeature[];
  is_active: boolean;
  updated_at: string;
};

export type PromoCodeRow = {
  id: string;
  code: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  description: string;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteContentRow = {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type LoveStoryItem = {
  year: string;
  title: string;
  description: string;
};

export type GiftAccountItem = {
  bank: string;
  accountNumber: string;
  accountHolder: string;
};

export type WeddingInvitation = {
  id: string;
  workspace_id: string;
  slug: string;
  is_published: boolean;
  theme: InvitationTheme;
  groom_name: string;
  groom_full_name: string;
  groom_parents: string;
  groom_instagram: string | null;
  bride_name: string;
  bride_full_name: string;
  bride_parents: string;
  bride_instagram: string | null;
  opening_quote: string;
  quote_source: string;
  cover_photo_url: string | null;
  akad_date: string | null;
  akad_time: string;
  akad_venue: string;
  akad_address: string;
  akad_maps_url: string | null;
  resepsi_date: string | null;
  resepsi_time: string;
  resepsi_venue: string;
  resepsi_address: string;
  resepsi_maps_url: string | null;
  love_stories: LoveStoryItem[];
  gift_accounts: GiftAccountItem[];
  gift_address: string | null;
  gallery_urls: string[];
  show_rsvp: boolean;
  show_gift: boolean;
  closing_message: string;
  created_at: string;
  updated_at: string;
};

export type InvitationRsvp = {
  id: string;
  invitation_id: string;
  workspace_id: string;
  guest_name: string;
  attendance: RsvpAttendance;
  guest_count: number;
  message: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "full_name" | "email">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription> &
          Pick<Subscription, "user_id" | "order_id" | "plan" | "amount">;
        Update: Partial<Subscription>;
        Relationships: [];
      };
      workspaces: {
        Row: Workspace;
        Insert: Partial<Workspace> &
          Pick<Workspace, "couple_title" | "plan" | "invite_code">;
        Update: Partial<Workspace>;
        Relationships: [];
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: Partial<WorkspaceMember> &
          Pick<WorkspaceMember, "workspace_id" | "user_id" | "role">;
        Update: Partial<WorkspaceMember>;
        Relationships: [];
      };
      budget_categories: {
        Row: BudgetCategory;
        Insert: Partial<BudgetCategory> &
          Pick<BudgetCategory, "workspace_id" | "phase" | "name">;
        Update: Partial<BudgetCategory>;
        Relationships: [];
      };
      budget_items: {
        Row: BudgetItem;
        Insert: Partial<BudgetItem> &
          Pick<BudgetItem, "workspace_id" | "category_id" | "phase" | "title">;
        Update: Partial<BudgetItem>;
        Relationships: [];
      };
      item_payments: {
        Row: ItemPayment;
        Insert: Partial<ItemPayment> &
          Pick<ItemPayment, "workspace_id" | "item_id" | "label" | "amount">;
        Update: Partial<ItemPayment>;
        Relationships: [];
      };
      wedding_gifts: {
        Row: WeddingGift;
        Insert: Partial<WeddingGift> &
          Pick<WeddingGift, "workspace_id" | "sender_name">;
        Update: Partial<WeddingGift>;
        Relationships: [];
      };
      honeymoon_checklists: {
        Row: HoneymoonChecklist;
        Insert: Partial<HoneymoonChecklist> &
          Pick<HoneymoonChecklist, "workspace_id" | "title">;
        Update: Partial<HoneymoonChecklist>;
        Relationships: [];
      };
      pricing_plans: {
        Row: PricingPlanRow;
        Insert: Partial<PricingPlanRow> &
          Pick<PricingPlanRow, "id" | "name" | "tagline" | "price" | "original_price">;
        Update: Partial<PricingPlanRow>;
        Relationships: [];
      };
      promo_codes: {
        Row: PromoCodeRow;
        Insert: Partial<PromoCodeRow> &
          Pick<PromoCodeRow, "code" | "discount_type" | "discount_value">;
        Update: Partial<PromoCodeRow>;
        Relationships: [];
      };
      site_contents: {
        Row: SiteContentRow;
        Insert: Partial<SiteContentRow> & Pick<SiteContentRow, "key" | "value">;
        Update: Partial<SiteContentRow>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Partial<PushSubscriptionRow> &
          Pick<
            PushSubscriptionRow,
            "user_id" | "workspace_id" | "endpoint" | "p256dh" | "auth"
          >;
        Update: Partial<PushSubscriptionRow>;
        Relationships: [];
      };
      wedding_invitations: {
        Row: WeddingInvitation;
        Insert: Partial<WeddingInvitation> &
          Pick<WeddingInvitation, "workspace_id" | "slug">;
        Update: Partial<WeddingInvitation>;
        Relationships: [];
      };
      invitation_rsvps: {
        Row: InvitationRsvp;
        Insert: Partial<InvitationRsvp> &
          Pick<
            InvitationRsvp,
            "invitation_id" | "workspace_id" | "guest_name" | "attendance"
          >;
        Update: Partial<InvitationRsvp>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      shares_workspace_with: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      plan_type: PlanType;
      payment_status: PaymentStatus;
      workspace_role: WorkspaceRole;
      funding_source: FundingSource;
      budget_phase: BudgetPhase;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
