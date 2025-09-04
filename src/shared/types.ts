import { z } from "zod";

// User Profiles
export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  role: z.enum(['interviewer', 'admin']),
  name: z.string(),
  phone: z.string().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Surveys
export const SurveySchema = z.object({
  id: z.number(),
  title: z.string(),
  city: z.string(),
  neighborhoods: z.string(),
  sample_size: z.number(),
  deadline_date: z.string(),
  is_active: z.boolean(),
  created_by_admin_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Survey = z.infer<typeof SurveySchema>;

// Survey Questions
export const SurveyQuestionSchema = z.object({
  id: z.number(),
  survey_id: z.number(),
  question_text: z.string(),
  question_type: z.enum(['multiple_choice', 'text', 'rating']),
  options: z.string().optional(),
  is_required: z.boolean(),
  order_index: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;

// Interviews
export const InterviewSchema = z.object({
  id: z.number(),
  survey_id: z.number(),
  interviewer_id: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_validated: z.boolean(),
  location_justification: z.string().optional(),
  is_completed: z.boolean(),
  completed_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Interview = z.infer<typeof InterviewSchema>;

// Interview Responses
export const InterviewResponseSchema = z.object({
  id: z.number(),
  interview_id: z.number(),
  question_id: z.number(),
  response_text: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;

// API Request/Response types
export const CreateUserProfileSchema = z.object({
  role: z.enum(['interviewer', 'admin']),
  name: z.string().min(2),
  phone: z.string().optional(),
});

export type CreateUserProfileRequest = z.infer<typeof CreateUserProfileSchema>;
