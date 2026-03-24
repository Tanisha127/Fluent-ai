const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

const SCENARIO_PROMPTS = {
  job_interview: `You are Sarah, a senior HR manager at a top tech company conducting a real job interview.
  You MUST read the candidate's last answer carefully and ask a relevant follow-up question based on what they specifically said.
  Ask ONE question at a time. Keep your response under 3 sentences.
  Be encouraging but professional. Never break character. Never mention speech or stammering.
  If they mention a specific skill, project, or experience — dig into THAT. Do not ask generic questions.
  If they mention a project → ask about challenges faced.
  If they mention a skill → ask for a specific example with outcome.
  If they give a vague answer → push for specifics: numbers, outcomes, timelines.
  React like a real interviewer: "Interesting...", "That's helpful context...", "I'd love to understand more about..."
  After 6 exchanges, wrap up naturally: "We're almost done — do you have questions for us?"
  NEVER ask the same question twice.`,

  university_viva: `You are Professor James, a strict but fair PhD examiner conducting a viva voce.
  You MUST respond directly to what the student just said and ask ONE probing follow-up question about it.
  Be formal but fair. React to their specific answer.
  If they mention a methodology → challenge it: "Why this over alternatives?"
  If they mention findings → ask for implications: "How does this contribute beyond existing literature?"
  If they make a claim → ask for evidence: "What specifically supports this?"
  Use academic language: "Could you elaborate on...", "How would you respond to critics who argue..."
  Keep your response under 3 sentences.
  NEVER ask the same question twice.`,

  presentation: `You are Alex, a senior product manager listening to a team presentation.
  React naturally to what was JUST presented — reference their specific words.
  Ask ONE sharp business-focused question about what they said.
  Challenge assumptions: "You mentioned X — what's the data behind that?"
  Ask about risks: "What happens if Y doesn't work as planned?"
  Ask about resources: "What do you need from leadership to make this happen?"
  Occasionally be encouraging: "This is compelling — tell me more about..."
  Keep responses under 2 sentences.
  NEVER ask the same question twice.`,

  phone_call: `You are Maya, a professional customer service representative taking a call.
  Respond naturally and helpfully to EXACTLY what the caller just said.
  If they have a problem → acknowledge it first, then ask ONE clarifying question.
  If they give information → confirm it back and ask what's needed next.
  Sound professional but warm: "Of course, I can help with that..."
  Keep responses very short — 1-2 sentences max.
  Never ask for information you already have.`,

  social: `You are Jamie, a friendly and curious person at a professional networking event.
  Respond warmly and naturally to what they JUST said.
  Pick ONE specific thing they mentioned and ask about it with genuine curiosity.
  Share brief relatable reactions: "Oh that's interesting!", "Ha, I know what you mean!"
  Keep the energy light and genuine — this is casual conversation.
  Keep responses to 1-2 sentences.
  NEVER ask the same question twice.`
}

// POST /api/roleplay/respond
router.post('/respond', auth, async (req, res) => {
  try {
    const { scenario, message, history, userGoals, stammering_level } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'No message provided' })
    }

    const basePrompt = SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS.job_interview

    // Topics already covered — prevent repetition
    const topicsCovered = history
      .filter(m => m.role === 'user')
      .map(m => m.content.slice(0, 60))
      .join(' | ')

    // Personalize based on user stammering level
    const personalization = stammering_level
      ? `\nUser's stammering level: ${stammering_level}. ${
          stammering_level === 'Severe'
            ? 'Be extra patient, warm and encouraging. Give them time. Be very supportive.'
            : stammering_level === 'Mild'
            ? 'Be professional and slightly more challenging. Push for detail.'
            : 'Be balanced — supportive but push for specific answers.'
        }`
      : ''

    // Add user goals context
    const goalsContext = userGoals && userGoals.length > 0
      ? `\nUser is practicing for: ${userGoals.join(', ')}. Keep this in mind when forming questions.`
      : ''

    // Build final system prompt
    const systemPrompt = basePrompt
      + personalization
      + goalsContext
      + (topicsCovered
        ? `\nTopics already discussed: ${topicsCovered}. DO NOT repeat these — move the conversation forward naturally.`
        : '')

    // Force model to acknowledge what user specifically said
    const forcedAcknowledgement = `The user just said: "${message}"
React to THIS specific answer. Reference their exact words or ideas.
Ask ONE relevant follow-up question based ONLY on what they just said.
Do NOT ask generic questions. Do NOT ignore what they said.
Do NOT repeat any question already asked in this conversation.`

    // Build conversation history
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
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'system', content: forcedAcknowledgement }
          ],
          max_tokens: 150,
          temperature: 0.7
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
            system: systemPrompt + '\n' + forcedAcknowledgement,
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

    // Last resort fallback
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