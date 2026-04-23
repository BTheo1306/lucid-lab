# Bot Tuning Questionnaire

Fill this out (edit answers in place under each question). Keep it as casual or as detailed as you want — examples often help more than rules. When done, hand it back and I'll translate it into concrete changes (system prompt, KB entries, guardrails, tool behaviour, UI copy).

---

## 1. Identity & voice

**1.1 Bot name** — Does it have one? (e.g. "Lucid", "Lab", "Clara", none)
> 

**1.2 Persona in one sentence** — Who is the bot pretending to be? (e.g. "an in-house solutions engineer at Lucid-Lab", "a friendly front-desk concierge", "a blunt senior consultant")
> 

**1.3 Tone** — pick or describe
- [ ] Professional / corporate
- [ ] Warm & conversational (current default)
- [ ] Punchy / direct / no-BS
- [ ] Playful with dry humour
- [ ] Other: 

**1.4 Formality** — tutoiement or vouvoiement in French?
> 

**1.5 Emojis** — love them, hate them, sparingly?
> 

**1.6 Markdown formatting** — current replies use headings, tables, bullets. Keep rich? Or prefer plain conversational paragraphs?
> 

**1.7 Reply length** — shorter (2-4 sentences max) / medium (current) / let it breathe?
> 

---

## 2. Three example exchanges (most useful section)

Paste or invent 3 examples. Left = user, right = your ideal bot reply. Don't worry about perfection — show the vibe.

**Example A** — a typical prospect question
> User: 
> Ideal reply: 

**Example B** — a pricing / cost question
> User: 
> Ideal reply: 

**Example C** — an off-topic or tricky question (e.g. "est-ce que l'IA va remplacer mon équipe ?", competitor comparison, vague fishing question)
> User: 
> Ideal reply: 

---

## 3. What the bot SHOULD do

**3.1 Primary goal** — rank 1-4 (1 = highest)
- [ ] Book a discovery call (TidyCal)
- [ ] Capture lead info (email, company, need)
- [ ] Educate / answer questions
- [ ] Qualify fit before offering a call

**3.2 When should it push for a booking?** (e.g. "after 2 exchanges", "only if user seems like a real prospect", "only if they ask", "as soon as they describe a pain point")
> 

**3.3 What info must it try to collect before proposing a call?** (name, email, company, team size, budget, timeline, pain point… pick what matters)
> 

**3.4 Booking link to share** — currently `https://tidycal.com/lucid-lab/audit-flash-30-minutes`. Correct? Different link per language/context?
> 

---

## 4. What the bot SHOULD NOT do

**4.1 Topics to refuse or deflect** (e.g. legal advice, pricing guarantees, specific tech recommendations without audit, politics, competitor bashing)
> 

**4.2 Claims it must never make** (e.g. "guaranteed ROI", specific %s, delivery timelines, client names without permission)
> 

**4.3 Hard rules** (e.g. "never give a price range", "always recommend an audit before quoting", "never mention specific tools we use unless asked")
> 

---

## 5. Content & positioning

**5.1 One-liner pitch** — if you had to rewrite Lucid-Lab's positioning in one sentence, what is it?
> 

**5.2 Who is the ideal client?** (industry, size, stage, role of buyer)
> 

**5.3 Who is NOT a fit?** (bot should gently redirect/decline) — e.g. solo freelancers, <10 employees, "I just want a quick chatbot for €500"
> 

**5.4 Top 3 services to emphasize**
> 1. 
> 2. 
> 3. 

**5.5 Differentiators vs. consultants / agencies** — what makes Lucid-Lab different in 2-3 bullets?
> - 
> - 
> - 

**5.6 Social proof / case studies the bot can reference** — any real client names/outcomes it CAN mention? Or keep generic?
> 

**5.7 Pricing stance** — when asked "combien ça coûte ?"
- [ ] Give a range (which? e.g. "projets à partir de X€")
- [ ] Deflect to audit call
- [ ] Ballpark by project type
- [ ] Other: 

---

## 6. Languages & localization

**6.1 Supported languages** — FR + EN only, or add others? (current KB has both)
> 

**6.2 Default language when ambiguous**
> 

**6.3 Any vocabulary preferences?** (e.g. "solutions IA" vs "intelligence artificielle", "clients" vs "partenaires", "audit" vs "diagnostic")
> 

---

## 7. Edge cases & escalation

**7.1 When user seems frustrated or the bot is stuck** — what should happen? (propose human handoff? share direct email? just apologize?)
> 

**7.2 Direct contact to hand out if needed** (email, phone — or "never, always push booking")
> 

**7.3 Sensitive / urgent requests** (e.g. "I need this done by Friday", "my CEO is angry") — how to handle?
> 

**7.4 If someone asks for a free deliverable** (e.g. "peux-tu m'écrire un prompt pour…", "génère-moi un plan d'automatisation") — help a bit / deflect / refuse?
> 

---

## 8. UI / widget behaviour (optional)

**8.1 First message** shown when user opens the chat (currently auto-greeting — want a specific opener?)
> 

**8.2 Suggested quick-reply chips** — want 3 starter buttons? (e.g. "Vos services", "Prix", "Prendre RDV")
> 

**8.3 When should the bubble appear?** (immediately / after X seconds / on scroll / only on certain pages)
> 

---

## 9. Anything else

Free-form notes, must-reads, brand voice docs to paste, links, vibes:
> 

---

*When you're done, save & paste the whole file back. I'll turn it into: updated system prompt, new/edited KB entries, tightened guardrails, and any UI tweaks.*
