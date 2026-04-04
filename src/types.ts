export type Settlement = {
  id: string;
  postId: number;
  title: string;
  slug: string;
  sourceUrl: string;
  claimUrl: string | null;
  imageUrl: string | null;
  category: string;
  description: string;
  publishedAt: string;
  deadline: string | null;
  deadlineLabel: string | null;
  finalHearing: string | null;
  finalHearingLabel: string | null;
  potentialAward: string | null;
  proofRequired: string | null;
  totalSettlementAmount: string | null;
  eligibilitySummary: string;
  locationSummary: string;
  notesSummary: string;
  stateTags: string[];
  keywordTags: string[];
};

export type AppliedState = Record<
  string,
  {
    applied: boolean;
    updatedAt: string;
  }
>;
