import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const WaveVisualizer = () => (
  <div className="flex items-center gap-1 h-12">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1.5 rounded-full"
        style={{
          background: `hsl(${260 + i * 4}, 80%, ${60 + Math.sin(i) * 15}%)`,
          originY: 0.5
        }}
        animate={{
          scaleY: [0.3, 1, 0.5, 0.8, 0.3],
          opacity: [0.6, 1, 0.7, 0.9, 0.6]
        }}
        transition={{
          duration: 1.5,
          delay: i * 0.07,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        initial={{ height: 8 + Math.random() * 24 }}
      />
    ))}
  </div>
)

const stats = [
  { value: '73%', label: 'Fluency improvement in 30 days' },
  { value: '1 in 100', label: 'Adults worldwide stammer' },
  { value: '< $0', label: 'Cost vs $150/hr therapy' },
  { value: '24/7', label: 'Always available coaching' }
]

const features = [
  {
    icon: '🎙️',
    title: 'AI Speech Analysis',
    desc: 'Real-time detection of blocks, repetitions, prolongations & voice tremor with a personalized Confidence Score.'
  },
  {
    icon: '🧠',
    title: 'Personalized Therapy',
    desc: 'Adaptive daily exercises — breathing drills, easy onset practice, slow speech training — tailored just for you.'
  },
  {
    icon: '🎭',
    title: 'Roleplay Simulator',
    desc: 'Practice job interviews, presentations, and phone calls with an AI conversation partner that never judges.'
  },
  {
    icon: '📊',
    title: 'Anxiety Heatmap',
    desc: 'Track which situations trigger your stammer. Spot patterns. Conquer your specific anxiety triggers.'
  },
  {
    icon: '🏆',
    title: 'Gamified Progress',
    desc: 'Earn Confidence XP, unlock badges, maintain streaks — make practice feel rewarding, not clinical.'
  },
  {
    icon: '🤝',
    title: 'Safe Community',
    desc: 'Anonymous rooms, peer support, and shared milestones. You are never alone on this journey.'
  }
]

const testimonials = [
  {
    quote: "I finally got through my job interview without shutting down. FluentAI gave me the practice reps I needed.",
    name: "Arjun, 24",
    role: "Software Engineer",
    avatar: "🧑‍💻"
  },
  {
    quote: "Three months in, my fluency score went from 42 to 79. The roleplay mode is pure magic for anxiety.",
    name: "Sarah, 31",
    role: "Teacher",
    avatar: "👩‍🏫"
  },
  {
    quote: "No judgment. No pressure. Just me, my voice, and a platform that actually understands what stammering feels like.",
    name: "Marcus, 19",
    role: "University Student",
    avatar: "🎓"
  }
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Navbar */}
      <motion.nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}
        style={{
          background: scrolled ? 'rgba(250, 248, 255, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              F
            </div>
            <span className="font-display font-semibold text-xl gradient-text">FluentAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Community', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium hover:text-lavender-600 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2">Start Free</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center gradient-bg relative overflow-hidden pt-20">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #8b5cf6, #7dd3fc)' }} />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-15 animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #f9a8d4, #8b5cf6)', animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <span className="badge badge-purple mb-4 inline-flex">
                🏆 Built for the 70+ million who stammer
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
              Your voice<br />
              <span className="gradient-text">deserves to</span><br />
              be heard.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg mb-8 leading-relaxed"
              style={{ color: 'var(--text-muted)' }}>
              AI-powered real-time coaching, personalized therapy exercises, and a safe community —
              all designed specifically for people who stammer. No judgment. Just growth.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary text-base px-8 py-4">
                Start Your Journey — Free ✨
              </Link>
              <a href="#how-it-works" className="btn-secondary text-base px-8 py-4">
                Watch Demo 🎥
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {['👩🏻', '🧑🏽', '👩🏾', '👦🏻'].map((em, i) => (
                  <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 border-white"
                    style={{ background: `hsl(${260 + i * 30}, 60%, 90%)` }}>
                    {em}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                <strong>2,400+</strong> people improved their fluency this month
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="glass-card p-8 relative"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎙️</div>
              <h3 className="font-display font-semibold text-lg">Live Speech Analysis</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Speak and watch your confidence score in real-time
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <WaveVisualizer />
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Fluency Rate', value: 78, color: '#8b5cf6' },
                { label: 'Speech Rate', value: 65, color: '#7dd3fc' },
                { label: 'Confidence Score', value: 82, color: '#86efac' }
              ].map(metric => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
                    <span className="font-semibold">{metric.value}%</span>
                  </div>
                  <div className="xp-bar">
                    <motion.div
                      className="xp-fill"
                      style={{ background: metric.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '✅', label: 'Blocks', value: '2' },
                { icon: '🔄', label: 'Repeats', value: '1' },
                { icon: '💨', label: 'Fillers', value: '3' }
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3"
                  style={{ background: 'rgba(139, 92, 246, 0.06)' }}>
                  <div className="text-lg">{item.icon}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                  <div className="font-bold text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(134, 239, 172, 0.1)', color: '#15803d' }}>
              💡 Tip: Try slow speech onset on the next phrase
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge badge-purple mb-4 inline-flex">8 Powerful Features</span>
            <h2 className="font-display text-4xl font-bold mb-4">
              Everything you need to <span className="gradient-text">find your voice</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              We've replaced expensive, generic therapy with intelligent, personalized, and joyful tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 group cursor-default"
                whileHover={{ y: -4 }}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 gradient-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Real voices, <span className="gradient-text">real confidence</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="text-5xl mb-4">{t.avatar}</div>
                <p className="text-sm italic mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12"
          >
            <div className="text-5xl mb-6">🌟</div>
            <h2 className="font-display text-4xl font-bold mb-4">
              Your journey starts with<br />
              <span className="gradient-text">one sentence.</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
              Join thousands who've discovered that confidence is a skill, not a gift. Start free today.
            </p>
            <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-block">
              Begin Your Free Trial ✨
            </Link>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              No credit card required. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>F</div>
            <span className="font-display font-semibold gradient-text">FluentAI</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Built with ❤️ for the 70+ million people who stammer worldwide
          </p>
          <div className="flex gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <a href="#" className="hover:text-lavender-600">Privacy</a>
            <a href="#" className="hover:text-lavender-600">Terms</a>
            <a href="#" className="hover:text-lavender-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
