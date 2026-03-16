const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

const SCENARIO_PROMPTS = {
  job_interview: `You are a professional, friendly HR interviewer conducting a job interview.
You MUST read the candidate's last answer carefully and ask a relevant follow-up question based on what they specifically said.
Ask ONE question at a time. Keep your response under 3 sentences.
Be encouraging but professional. Never break character. Never mention speech or stammering.
If they mention a specific skill, project, or experience — dig into THAT. Do not ask generic questions.`,

  university_viva: `You are an academic examiner for a PhD/Masters viva voce examination.
You MUST respond directly to what the student just said and ask ONE probing follow-up question about it.
Be formal but fair. React to their specific answer — if they mention a methodology, challenge it. If they mention findings, ask for implications.
Keep your response under 3 sentences.`,

  presentation: `You are an engaged team member listening to a presentation.
React to what was just said, then ask ONE specific clarifying question about that point.
Keep it professional and concise — under 3 sentences.`,

  phone_call: `You are a customer service representative taking a call.
Respond naturally and helpfully to exactly what the caller just said.
Ask only what you need next to help them. Keep responses concise — under 2 sentences.`,

  social: `You are a friendly person at a networking event meeting someone new.
Respond warmly and naturally to what they just said, then ask ONE follow-up question about something specific they mentioned.
Keep it light and conversational — under 2 sentences.`
}

// POST /api/roleplay/respond
router.post('/respond', auth, async (req, res) => {
  try {
    const { scenario, message, history } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'No message provided' })
    }

    const systemPrompt = SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS.job_interview

    // Build full conversation history INCLUDING the new user message
    const conversationHistory = [
      ...history.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: message }
    ]

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
          ],
          max_tokens: 150,
          temperature: 0.8
        })

        return res.json({ response: response.choices[0].message.content })
      } catch (aiErr) {
        console.log('OpenAI roleplay failed:', aiErr.message)
      }
    }

    // Try Anthropic as fallback
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const fetch = require('node-fetch')
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            system: systemPrompt,
            messages: conversationHistory
          })
        })

        const data = await anthropicRes.json()
        if (data.content && data.content[0] && data.content[0].text) {
          return res.json({ response: data.content[0].text })
        }
      } catch (anthropicErr) {
        console.log('Anthropic roleplay failed:', anthropicErr.message)
      }
    }

    // Last resort fallback — still tries to be relevant
    const fallback = getFallbackResponse(scenario, history.length, message)
    res.json({ response: fallback })

  } catch (err) {
    console.error('Roleplay route error:', err)
    res.status(500).json({ message: 'Roleplay error', error: err.message })
  }
})

// POST /api/roleplay/save-session
router.post('/save-session', auth, async (req, res) => {
  try {
    const { scenario, exchanges, avg_fluency, duration, messages } = req.body
    res.json({ saved: true, xp_earned: 80 + exchanges * 10 })
  } catch (err) {
    res.status(500).json({ message: 'Failed to save session' })
  }
})

function getFallbackResponse(scenario, historyLength, userMessage) {
  const snippet = userMessage.slice(0, 60).trim()

  const responses = {
    job_interview: [
      `That's interesting — you mentioned "${snippet}". Can you walk me through a specific example of that in action?`,
      `I appreciate you sharing that. When you say "${snippet}" — what was the outcome, and what did you learn?`,
      `Good point. How has the experience you just described shaped the way you approach your work today?`,
      `That shows real initiative. What specific skills did you develop through that, and how are they relevant to this role?`,
      `Thank you for that. Where do you see yourself building on what you just described in the next three to five years?`,
      `We're almost done — do you have any questions for us about the role or the team?`
    ],
    phone_call: [
      `I understand. Can you give me a bit more detail about "${snippet}" so I can help you better?`,
      `Got it. Let me check that for you — can you confirm your account number while I look into this?`,
      `I see. And is there anything else related to "${snippet}" I should know before I process this?`,
      `That's been noted. Is there anything else I can help you with today?`,
      `Of course. Our policy on that is straightforward — let me walk you through it step by step.`
    ],
    university_viva: [
      `You mentioned "${snippet}" — can you elaborate on how that supports your central argument?`,
      `Interesting. What are the main limitations of the approach you just described?`,
      `How does what you just said address the gap in the existing literature you identified?`,
      `If you were to extend this research, how would the point you just made influence your next steps?`,
      `How would you respond to a critic who argues that "${snippet}" is not sufficient evidence for your conclusions?`
    ],
    social: [
      `Oh that's cool — you mentioned "${snippet}". How did you get into that?`,
      `Really? That's interesting! What's the most exciting part of what you just described?`,
      `Ha, I can relate to that. So what does a typical day look like for you in that space?`,
      `Nice! Are you based here locally or did you travel for this event?`,
      `That's great to hear. Are you connected with many people in that field here tonight?`
    ],
    presentation: [
      `Thanks for that point about "${snippet}". Can you walk us through the data behind it?`,
      `Interesting. How does what you just presented compare to what competitors are doing?`,
      `Good context. What are the biggest risks to the timeline you've just outlined?`,
      `That's compelling — what resources would you need to move this to the next phase?`
    ]
  }

  const pool = responses[scenario] || responses.job_interview
  return pool[Math.min(historyLength, pool.length - 1)]
}

module.exports = router