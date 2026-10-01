export interface FeedbackPayload { email: string; message: string }
export interface FeedbackService { readonly available: boolean; submit(payload: FeedbackPayload): Promise<void> }

export class InactiveFeedbackService implements FeedbackService {
  readonly available = false
  async submit(): Promise<void> {
    throw new Error('Feedback service is not configured')
  }
}

export const feedbackService: FeedbackService = new InactiveFeedbackService()

export function validateFeedback(payload: FeedbackPayload, challenge: string) {
  const errors: Partial<Record<'email' | 'message' | 'challenge', string>> = {}
  if (!/^\S+@\S+\.\S+$/.test(payload.email.trim())) errors.email = 'email'
  if (payload.message.trim().length < 10) errors.message = 'message'
  if (challenge.trim() !== '7') errors.challenge = 'challenge'
  return errors
}
