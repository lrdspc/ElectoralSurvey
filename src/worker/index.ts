import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  exchangeCodeForSessionToken,
  authMiddleware,
  deleteSession,
  SESSION_TOKEN_COOKIE_NAME,
} from "./auth";
import { getOAuthRedirectUrl } from "./mocha-users-service";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { 
  CreateUserProfileSchema, 
  UserProfileSchema,
  SurveySchema,
  SurveyQuestionSchema,
  InterviewSchema
} from "@/shared/types";
import type { CustomContext } from "./types";

type Bindings = {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// OAuth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(c.env.DB, body.code);

  setCookie(c, SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  return c.json(user);
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(c.env.DB, sessionToken);
  }

  setCookie(c, SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// User Profile endpoints
app.get('/api/user-profiles/me', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const result = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first();

  if (!result) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json(UserProfileSchema.parse(result));
});

app.post('/api/user-profiles', authMiddleware, zValidator('json', CreateUserProfileSchema), async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const data = c.req.valid('json') as z.infer<typeof CreateUserProfileSchema>;

  // Check if profile already exists
  const existing = await c.env.DB.prepare(
    "SELECT id FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).first();

  if (existing) {
    return c.json({ error: "Profile already exists" }, 400);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO user_profiles (user_id, role, name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, data.role, data.name, data.phone || null).first();

  return c.json(UserProfileSchema.parse(result));
});

// Survey endpoints
app.get('/api/surveys', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first() as { role: 'interviewer' | 'admin' } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  let query = "SELECT * FROM surveys WHERE is_active = 1 ORDER BY created_at DESC";
  let params: any[] = [];

  // For interviewers, only show surveys assigned to them (we'll implement assignment logic later)
  if (profile.role === 'interviewer') {
    // For now, show all surveys - in production you'd filter by assignment
  }

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results.map((survey: any) => SurveySchema.parse(survey)));
});

app.post('/api/surveys', authMiddleware, zValidator('json', z.object({
  title: z.string().min(1),
  city: z.string().min(1),
  neighborhoods: z.string().min(1),
  sample_size: z.number().min(1),
  deadline_date: z.string(),
  questions: z.array(z.object({
    question_text: z.string().min(1),
    question_type: z.enum(['multiple_choice', 'text', 'rating']),
    options: z.string().optional(),
    is_required: z.boolean(),
    order_index: z.number(),
  })),
})), async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const data = c.req.valid('json') as {
    title: string;
    city: string;
    neighborhoods: string;
    sample_size: number;
    deadline_date: string;
    questions: Array<{
      question_text: string;
      question_type: 'multiple_choice' | 'text' | 'rating';
      options?: string;
      is_required: boolean;
      order_index: number;
    }>;
  };

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first() as { role: 'interviewer' | 'admin' } | null;

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Create survey
  const survey = await c.env.DB.prepare(`
    INSERT INTO surveys (title, city, neighborhoods, sample_size, deadline_date, is_active, created_by_admin_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(data.title, data.city, data.neighborhoods, data.sample_size, data.deadline_date, user.id).first();

  if (!survey) {
    return c.json({ error: "Failed to create survey" }, 500);
  }

  // Create survey questions
  for (const question of data.questions) {
    await c.env.DB.prepare(`
      INSERT INTO survey_questions (survey_id, question_text, question_type, options, is_required, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      survey.id,
      question.question_text,
      question.question_type,
      question.options || null,
      question.is_required,
      question.order_index
    ).run();
  }

  return c.json(SurveySchema.parse(survey));
});

app.get('/api/surveys/:id', authMiddleware, async (c: CustomContext) => {
  const surveyId = c.req.param('id');
  
  const survey = await c.env.DB.prepare(
    "SELECT * FROM surveys WHERE id = ? AND is_active = 1"
  ).bind(surveyId).first() as any;

  if (!survey) {
    return c.json({ error: "Survey not found" }, 404);
  }

  return c.json(SurveySchema.parse(survey));
});

app.get('/api/surveys/:id/questions', authMiddleware, async (c: CustomContext) => {
  const surveyId = c.req.param('id');
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_index ASC"
  ).bind(surveyId).all();

  return c.json(results.map(q => SurveyQuestionSchema.parse(q)));
});

// Interview endpoints
app.post('/api/interviews', authMiddleware, zValidator('json', z.object({
  survey_id: z.number(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_justification: z.string().optional(),
})), async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const data = c.req.valid('json');

  const interview = await c.env.DB.prepare(`
    INSERT INTO interviews (survey_id, interviewer_id, latitude, longitude, location_validated, location_justification, is_completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, 0, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(data.survey_id, user.id, data.latitude || null, data.longitude || null, data.location_justification || null).first();

  return c.json(InterviewSchema.parse(interview));
});

app.post('/api/interviews/:id/responses', authMiddleware, zValidator('json', z.object({
  responses: z.array(z.object({
    question_id: z.number(),
    response_text: z.string(),
  })),
})), async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const interviewId = c.req.param('id');
  const data = c.req.valid('json') as {
    responses: Array<{
      question_id: number;
      response_text: string;
    }>;
  };

  // Verify interview belongs to user
  const interview = await c.env.DB.prepare(
    "SELECT * FROM interviews WHERE id = ? AND interviewer_id = ?"
  ).bind(interviewId, user.id).first();

  if (!interview) {
    return c.json({ error: "Interview not found" }, 404);
  }

  // Save responses
  for (const response of data.responses) {
    await c.env.DB.prepare(`
      INSERT INTO interview_responses (interview_id, question_id, response_text, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(interviewId, response.question_id, response.response_text).run();
  }

  // Mark interview as completed
  await c.env.DB.prepare(
    "UPDATE interviews SET is_completed = 1, completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).bind(interviewId).run();

  return c.json({ success: true });
});

app.get('/api/interviews/my', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM interviews WHERE interviewer_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();

  return c.json(results.map(interview => InterviewSchema.parse(interview)));
});

// Statistics and reports
app.get('/api/reports/survey/:id', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const surveyId = c.req.param('id');

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first() as { role: 'interviewer' | 'admin' } | null;

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Get survey details
  const survey = await c.env.DB.prepare(
    "SELECT * FROM surveys WHERE id = ? AND is_active = 1"
  ).bind(surveyId).first() as any;

  if (!survey) {
    return c.json({ error: "Survey not found" }, 404);
  }

  // Get interview statistics
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_interviews,
      COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_interviews,
      COUNT(DISTINCT interviewer_id) as unique_interviewers
    FROM interviews 
    WHERE survey_id = ?
  `).bind(surveyId).first();

  // Get responses by question
  const responses = await c.env.DB.prepare(`
    SELECT 
      sq.id as question_id,
      sq.question_text,
      sq.question_type,
      sq.options,
      ir.response_text,
      COUNT(*) as response_count
    FROM survey_questions sq
    LEFT JOIN interview_responses ir ON sq.id = ir.question_id
    LEFT JOIN interviews i ON ir.interview_id = i.id
    WHERE sq.survey_id = ? AND i.is_completed = 1
    GROUP BY sq.id, ir.response_text
    ORDER BY sq.order_index, response_count DESC
  `).bind(surveyId).all();

  return c.json({
    survey: SurveySchema.parse(survey),
    statistics: stats,
    responses: responses.results,
  });
});

// Survey management - Edit survey
app.put('/api/surveys/:id', authMiddleware, zValidator('json', z.object({
  title: z.string().min(1),
  city: z.string().min(1),
  neighborhoods: z.string().min(1),
  sample_size: z.number().min(1),
  deadline_date: z.string(),
})), async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const surveyId = c.req.param('id');
  const data = c.req.valid('json') as {
    title: string;
    city: string;
    neighborhoods: string;
    sample_size: number;
    deadline_date: string;
  };

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first() as { role: 'interviewer' | 'admin' } | null;

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const result = await c.env.DB.prepare(`
    UPDATE surveys 
    SET title = ?, city = ?, neighborhoods = ?, sample_size = ?, deadline_date = ?, updated_at = datetime('now')
    WHERE id = ? AND created_by_admin_id = ?
    RETURNING *
  `).bind(data.title, data.city, data.neighborhoods, data.sample_size, data.deadline_date, surveyId, user.id).first();

  if (!result) {
    return c.json({ error: "Survey not found or unauthorized" }, 404);
  }

  return c.json(SurveySchema.parse(result));
});

// Survey management - Toggle active status
app.patch('/api/surveys/:id/toggle', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const surveyId = c.req.param('id');

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first() as { role: 'interviewer' | 'admin' } | null;

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const result = await c.env.DB.prepare(`
    UPDATE surveys 
    SET is_active = NOT is_active, updated_at = datetime('now')
    WHERE id = ? AND created_by_admin_id = ?
    RETURNING *
  `).bind(surveyId, user.id).first();

  if (!result) {
    return c.json({ error: "Survey not found or unauthorized" }, 404);
  }

  return c.json(SurveySchema.parse(result));
});

// Survey management - Delete survey
app.delete('/api/surveys/:id', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const surveyId = c.req.param('id');

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first() as { role: 'interviewer' | 'admin' } | null;

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Delete related data first
  await c.env.DB.prepare("DELETE FROM interview_responses WHERE interview_id IN (SELECT id FROM interviews WHERE survey_id = ?)").bind(surveyId).run();
  await c.env.DB.prepare("DELETE FROM interviews WHERE survey_id = ?").bind(surveyId).run();
  await c.env.DB.prepare("DELETE FROM survey_questions WHERE survey_id = ?").bind(surveyId).run();
  
  const result = await c.env.DB.prepare("DELETE FROM surveys WHERE id = ? AND created_by_admin_id = ?").bind(surveyId, user.id).run();

  if (!result.success) {
    return c.json({ error: "Survey not found or unauthorized" }, 404);
  }

  return c.json({ success: true });
});

// User management endpoints
app.get('/api/admin/interviewers', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first();

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT 
      up.*,
      COUNT(DISTINCT i.id) as total_interviews,
      COUNT(DISTINCT CASE WHEN i.is_completed = 1 THEN i.id END) as completed_interviews,
      MAX(i.created_at) as last_activity
    FROM user_profiles up
    LEFT JOIN interviews i ON up.user_id = i.interviewer_id
    WHERE up.role = 'interviewer'
    GROUP BY up.id
    ORDER BY up.created_at DESC
  `).all();

  return c.json(results);
});

app.patch('/api/admin/interviewers/:userId/toggle', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const targetUserId = c.req.param('userId');

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first();

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const result = await c.env.DB.prepare(`
    UPDATE user_profiles 
    SET is_active = NOT is_active, updated_at = datetime('now')
    WHERE user_id = ? AND role = 'interviewer'
    RETURNING *
  `).bind(targetUserId).first();

  if (!result) {
    return c.json({ error: "Interviewer not found" }, 404);
  }

  return c.json(UserProfileSchema.parse(result));
});

// Export endpoints
app.get('/api/export/survey/:id/excel', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const surveyId = c.req.param('id');

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first();

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Get survey data
  const survey = await c.env.DB.prepare("SELECT * FROM surveys WHERE id = ?").bind(surveyId).first();
  const questions = await c.env.DB.prepare("SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_index").bind(surveyId).all();
  
  // Get responses with interview details
  const responses = await c.env.DB.prepare(`
    SELECT 
      i.id as interview_id,
      i.created_at as interview_date,
      up.name as interviewer_name,
      sq.question_text,
      ir.response_text,
      i.latitude,
      i.longitude
    FROM interviews i
    JOIN user_profiles up ON i.interviewer_id = up.user_id
    JOIN interview_responses ir ON i.id = ir.interview_id
    JOIN survey_questions sq ON ir.question_id = sq.id
    WHERE i.survey_id = ? AND i.is_completed = 1
    ORDER BY i.id, sq.order_index
  `).bind(surveyId).all();

  return c.json({
    survey,
    questions: questions.results,
    responses: responses.results
  });
});

// Notification endpoints
app.post('/api/notifications/send', authMiddleware, zValidator('json', z.object({
  title: z.string(),
  message: z.string(),
  target: z.enum(['all', 'admins', 'interviewers']).optional().default('all'),
})), async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const data = c.req.valid('json') as {
    title: string;
    message: string;
    target?: 'all' | 'admins' | 'interviewers';
  };

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first();

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // For now, just return success - real push notifications would require additional setup
  return c.json({ success: true, message: "Notification sent" });
});

// Admin dashboard statistics
app.get('/api/admin/dashboard', authMiddleware, async (c: CustomContext) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // Check if user is admin
  const profile = await c.env.DB.prepare(
    "SELECT role FROM user_profiles WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).first();

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const stats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM surveys WHERE is_active = 1) as active_surveys,
      (SELECT COUNT(*) FROM interviews WHERE is_completed = 1) as total_interviews,
      (SELECT COUNT(DISTINCT interviewer_id) FROM interviews WHERE created_at >= date('now', '-7 days')) as active_interviewers,
      (SELECT ROUND(AVG(CASE WHEN is_completed = 1 THEN 100.0 ELSE 0.0 END), 1) FROM interviews) as completion_rate
  `).first();

  // Get recent activity
  const recentActivity = await c.env.DB.prepare(`
    SELECT 
      i.created_at,
      i.is_completed,
      up.name as interviewer_name,
      s.title as survey_title,
      s.id as survey_id
    FROM interviews i
    JOIN user_profiles up ON i.interviewer_id = up.user_id
    JOIN surveys s ON i.survey_id = s.id
    WHERE i.created_at >= date('now', '-7 days')
    ORDER BY i.created_at DESC
    LIMIT 10
  `).all();

  return c.json({
    ...stats,
    recent_activity: recentActivity.results
  });
});

// Static file serving will be handled by Cloudflare in production

export default app;
