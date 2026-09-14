import { Poll, PollOption, PollVote, PollStatus, PollTargetScope } from '@prisma/client';

export interface PollFilter {
  search?: string;
  status?: PollStatus;
  page?: number;
  limit?: number;
}

export interface CreatePollDto {
  title: string;
  description?: string | null;
  options: string[]; // At least 2 options
  startAt: string;
  endAt: string;
  targetScope: PollTargetScope;
  targetValue?: string | null;
}

export interface UpdatePollDto {
  title?: string;
  description?: string | null;
  status?: PollStatus;
  endAt?: string;
  options?: string[]; // Allowed only if 0 votes
}

export interface VotePollDto {
  optionId: string;
}

export interface OptionResult {
  id: string;
  label: string;
  displayOrder: number;
  votesCount: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  title: string;
  status: PollStatus;
  startAt: Date;
  endAt: Date;
  eligibleApartments: number;
  totalVotes: number;
  participationRate: number; // e.g. 74.2%
  options: OptionResult[];
}

export type PollWithDetails = Poll & {
  createdBy: {
    id: string;
    fullName: string;
  };
  options: PollOption[];
  _count: {
    votes: number;
  };
  userVote?: {
    optionId: string;
    createdAt: Date;
  } | null;
};
