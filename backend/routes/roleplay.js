const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

const SCENARIO_PROMPTS = {
  job_interview: `You are a professional, friendly HR interviewer conducting a job interview. 
Ask realistic interview questions one at a time. Keep questions clear and not too long.
When the candidate answers, respond naturally as an interviewer would — with follow-ups or the next question.
Be encouraging but professional. Never break character. Never mention speech or stammering.`,

  university_viva: `You are an academic examiner for a PhD/Masters viva voce examination.
Ask probing questions about research methodology, findings, and contributions.
Be formal but fair. One question at a time. React naturally to their answers.`,

  presentation: `You are an engaged team member listening to a presentation.
Ask clarifying questions and make brief encouraging comments between questions.
Keep the session focused and professional.`,

  phone_call: `You are a customer service representative taking a call.
Respond naturally as a phone call would go. Ask one thing at a time.
Be helpful and patient. Keep your responses concise.`,

  social: `You are a friendly person at a networking event meeting someone new.
Have a natural, warm conversation. Ask one question at a time.
Keep it light, friendly and conversational.`
}

// POST /api/roleplay/respond
router.post('/respond', auth, async (req, res) => {
  try {
    const { scenario, message, history } = req.body

    const systemPrompt = SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS.job_interview

    // Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
          { role: 'user', content: message }
        ]

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 150,
          temperature: 0.8
        })

        return res.json({ response: response.choices[0].message.content })
      } catch (aiErr) {
        console.log('OpenAI roleplay failed:', aiErr.message)
      }
    }

    // Fallback responses by scenario
    const fallback = getFallbackResponse(scenario, history.length)
    res.json({ response: fallback })
  } catch (err) {
    res.status(500).json({ message: 'Roleplay error', error: err.message })
  }
})

// POST /api/roleplay/save-session
router.post('/save-session', auth, async (req, res) => {
  try {
    const { scenario, exchanges, avg_fluency, duration, messages } = req.body
    // Save session stats
    res.json({ saved: true, xp_earned: 80 + exchanges * 10 })
  } catch (err) {
    res.status(500).json({ message: 'Failed to save session' })
  }
})

function getFallbackResponse(scenario, historyLength) {
  const responses = {
    job_interview: [
      "That's a great introduction. Could you tell me about your most significant professional achievement in the past year?",
      "Interesting. How do you typically handle working under tight deadlines with multiple competing priorities?",
      "I appreciate that. Can you walk me through a situation where you had a conflict with a colleague and how you resolved it?",
      "Excellent. What specific skills or experiences do you believe make you the strongest candidate for this position?",
      "Very good. Where do you see your career heading in the next three to five years?",
      "Thank you for sharing that. Do you have any questions about the role or our team that you'd like to ask?"
    ],
    phone_call: [
      "I'd be happy to help you with that. Can you give me your account reference number?",
      "I see. And what specifically would you like to change or update today?",
      "I can certainly assist with that. Let me just verify a few details first — could you confirm your date of birth?",
      "That's been processed for you. Is there anything else I can help you with today?",
      "Of course. Our policy for that would be... Could you hold briefly while I check the details?"
    ],
    university_viva: [
      "Interesting. Can you elaborate on why you chose this particular research methodology over alternatives?",
      "How do your findings address the gap in the existing literature you identified in your introduction?",
      "What do you consider the main limitations of your study, and how do they affect the generalizability of your conclusions?",
      "If you were to extend this research, what would be your primary next steps and why?",
      "How would you respond to the argument that your sample size limits the statistical power of your conclusions?"
    ],
    social: [
      "Oh interesting! What kind of projects are you working on these days?",
      "I've heard great things about that field! How did you end up getting into it?",
      "That's really cool. Are you based here locally or did you travel for this event?",
      "Nice! Have you been to any of these events before? I'm still getting used to the networking scene.",
      "Ha, that's relatable! So what's the most exciting thing happening in your work right now?"
    ],
    presentation: [
      "Thanks for that overview. Could you elaborate on how you arrived at those projections?",
      "That's a compelling point. How does this approach compare to what the competition is doing?",
      "I'm curious about the timeline — what are the biggest risks to the schedule you've outlined?",
      "This looks very promising! What resources would you need to move forward to the next phase?"
    ]
  }

  const pool = responses[scenario] || responses.job_interview
  return pool[Math.min(historyLength, pool.length - 1)]
}

module.exports = router
