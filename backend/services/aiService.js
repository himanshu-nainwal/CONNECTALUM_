import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
let genAI = null;

if (apiKey && apiKey !== "your_gemini_api_key_here") {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn("Gemini client initialization failed, falling back to local engine:", err.message);
  }
}

// -------------------------------------------------------------
// Helper: Clean JSON extraction from LLM Markdown responses
// -------------------------------------------------------------
const parseJsonFromMarkdown = (text) => {
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    return null;
  } catch {
    return null;
  }
};

// -------------------------------------------------------------
// 1. AI Job & Resume Semantic Matching (Module 3)
// -------------------------------------------------------------
export const computeSemanticJobMatch = async (studentProfile, job) => {
  const studentSkills = (studentProfile.skills || []).map((s) => s.toLowerCase().trim());
  const jobRequirements = (job.requirements || "").toLowerCase();
  const jobDescription = (job.description || "").toLowerCase();
  const jobSkills = (job.skills_required || []).map((s) => s.toLowerCase().trim());

  // Aggregate job skill set
  const allJobKeywords = Array.from(new Set([...jobSkills, ...extractKeywords(jobRequirements + " " + jobDescription)]));

  // Compute local overlap & similarity
  const matched = [];
  const missing = [];

  allJobKeywords.forEach((skill) => {
    if (studentSkills.some((s) => s.includes(skill) || skill.includes(s))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  const baseMatch = allJobKeywords.length > 0 ? Math.round((matched.length / allJobKeywords.length) * 100) : 75;
  const matchScore = Math.min(98, Math.max(25, baseMatch));

  // If Gemini API is available, enhance with AI tips
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an AI Job Matching Engine.
Candidate Skills: ${studentSkills.join(", ") || "General Computer Science"}
Candidate Department: ${studentProfile.department || "Computer Science"}
Job Title: ${job.title}
Job Requirements: ${job.requirements || job.description}

Analyze compatibility. Respond ONLY with valid JSON:
{
  "match_score": ${matchScore},
  "matched_skills": ${JSON.stringify(matched.slice(0, 6))},
  "missing_skills": ${JSON.stringify(missing.slice(0, 5))},
  "ai_tips": "A 2-sentence actionable advice on what specific project or skill to add to improve referral chances."
}`;
      const result = await model.generateContent(prompt);
      const parsed = parseJsonFromMarkdown(result.response.text());
      if (parsed) return parsed;
    } catch (err) {
      console.warn("Gemini job match error, using local computation:", err.message);
    }
  }

  // Graceful rule-based engine
  return {
    match_score: matchScore,
    matched_skills: matched.slice(0, 6),
    missing_skills: missing.slice(0, 5),
    ai_tips:
      missing.length > 0
        ? `Focus on building projects demonstrating ${missing.slice(0, 3).join(", ")} to boost your candidate match to 90%+ for ${job.company}.`
        : `Strong profile match for ${job.title}! Highlight your quantitative project results to stand out to alumni referrers.`,
  };
};

function extractKeywords(text) {
  const commonTech = [
    "react", "node.js", "javascript", "typescript", "python", "java", "c++",
    "mongodb", "sql", "postgresql", "docker", "aws", "git", "express",
    "machine learning", "data structures", "algorithms", "rest api", "tailwind",
    "html", "css", "next.js", "kubernetes", "linux", "system design"
  ];
  return commonTech.filter((tech) => text.includes(tech));
}

// -------------------------------------------------------------
// 2. AI Resume Diagnostic Analyzer & ATS Scoring Engine (Module 5)
// -------------------------------------------------------------
export const analyzeResumeDiagnostic = async (resumeText, targetRole = "Software Development Engineer") => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a certified Applicant Tracking System (ATS) Diagnostic Analyzer and Senior Tech Recruiter.
Evaluate the following resume text specifically for the target role: "${targetRole}".

Resume Content:
"""
${resumeText.slice(0, 6000)}
"""

Provide a detailed evaluation report. Return ONLY a valid JSON object matching this schema:
{
  "overall_ats_score": 82,
  "formatting_score": 85,
  "action_verbs_score": 78,
  "metric_density_score": 72,
  "target_role": "${targetRole}",
  "skill_gap_analysis": {
    "identified_skills": ["React", "Node.js", "MongoDB"],
    "missing_in_demand_skills": ["Docker", "CI/CD", "Unit Testing", "AWS"]
  },
  "strengths": [
    "Point 1",
    "Point 2"
  ],
  "critical_improvements": [
    "Point 1",
    "Point 2"
  ],
  "section_rewrites": {
    "summary": "Impact-driven professional summary recommendation...",
    "experience_bullet_examples": [
      "Original: Worked on backend APIs -> Rewritten (STAR method): Engineered scalable RESTful microservices in Node.js, reducing API latency by 34% for 10k+ daily users."
    ],
    "skills_organization_tip": "Categorize technical skills into Languages, Frameworks, Cloud & Databases, and Developer Tools."
  }
}`;
      const result = await model.generateContent(prompt);
      const parsed = parseJsonFromMarkdown(result.response.text());
      if (parsed) return parsed;
    } catch (err) {
      console.warn("Gemini resume analysis error, using fallback engine:", err.message);
    }
  }

  // Fallback intelligent diagnostic engine
  const length = resumeText.length;
  const hasNumbers = (resumeText.match(/\d+%/g) || []).length + (resumeText.match(/\d+\+/g) || []).length;
  const actionVerbsList = ["built", "engineered", "developed", "led", "designed", "architected", "optimized", "implemented", "reduced", "increased"];
  const verbCount = actionVerbsList.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(resumeText)).length;
  const identified = extractKeywords(resumeText.toLowerCase());

  const formatting = Math.min(95, Math.max(60, Math.round(50 + length / 200)));
  const actionScore = Math.min(95, Math.max(50, verbCount * 12));
  const metricScore = Math.min(92, Math.max(45, hasNumbers * 15 + 40));
  const overall = Math.round((formatting * 0.3) + (actionScore * 0.35) + (metricScore * 0.35));

  return {
    overall_ats_score: overall,
    formatting_score: formatting,
    action_verbs_score: actionScore,
    metric_density_score: metricScore,
    target_role: targetRole,
    skill_gap_analysis: {
      identified_skills: identified.length ? identified : ["JavaScript", "React", "Node.js", "Git"],
      missing_in_demand_skills: ["Docker", "Kubernetes", "AWS / Cloud", "System Design", "CI/CD Pipelines"],
    },
    strengths: [
      "Clear chronological project and education history format",
      "Relevant foundational core engineering concepts present",
      `Detected ${identified.length} primary technical stack keywords`,
    ],
    critical_improvements: [
      "Increase quantifiable impact metrics (e.g. latency improvements, user scale, % efficiency)",
      "Swap generic descriptions with strong action verbs (e.g., replace 'worked on' with 'spearheaded' or 'architected')",
      "Align section headers strictly to ATS standard names: 'Work Experience', 'Technical Skills', 'Education'",
    ],
    section_rewrites: {
      summary: `Proactive ${targetRole} skilled in ${identified.slice(0, 3).join(", ") || "full-stack development"}. Proven track record of architecting performant applications, optimizing data flows, and collaborating across agile teams to deliver production-ready software solutions.`,
      experience_bullet_examples: [
        "Before: Created web app features in React -> After: Designed and deployed 6 responsive React modules with client-side state caching, boosting user retention by 22%.",
        "Before: Managed database and API -> After: Implemented normalized MongoDB schemas and index optimizations, decreasing query execution times by 40%.",
      ],
      skills_organization_tip: "Structure skills into: Languages (JavaScript, Python), Frameworks (React, Express), Databases (MongoDB, PostgreSQL), and DevOps/Tools (Git, Docker, Postman).",
    },
  };
};

// -------------------------------------------------------------
// 3. Interactive AI Mock Interviewer & Evaluation (Module 6)
// -------------------------------------------------------------
export const generateInterviewQuestion = async (role, level = "Junior", history = []) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an expert Senior Technical Interviewer conducting a mock interview for the role of "${role}" at "${level}" level.
Previous questions asked so far:
${history.map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`).join("\n\n")}

Generate the NEXT interview question. It can be technical, coding concept, or behavioral/scenario-based.
Return ONLY valid JSON:
{
  "question_number": ${history.length + 1},
  "category": "Technical | Coding Logic | System Design | Behavioral",
  "question": "The interview question text here...",
  "hint": "A subtle hint for the candidate if they get stuck."
}`;
      const result = await model.generateContent(prompt);
      const parsed = parseJsonFromMarkdown(result.response.text());
      if (parsed) return parsed;
    } catch (err) {
      console.warn("Gemini interview question error, using fallback bank:", err.message);
    }
  }

  // Question bank fallback
  const fallbackBank = {
    "Frontend Developer": [
      { category: "Technical", question: "Can you explain the Virtual DOM in React and how the reconciliation process (Fiber) works?", hint: "Think about diffing algorithm and batching state updates." },
      { category: "Coding Logic", question: "How would you optimize a large web app that is re-rendering too frequently? Mention React.memo, useMemo, and useCallback.", hint: "Address referential equality of callbacks and props." },
      { category: "Behavioral", question: "Tell me about a challenging bug you encountered in frontend code and how you methodically debugged it.", hint: "Use the STAR method (Situation, Task, Action, Result)." },
    ],
    "Full Stack Developer": [
      { category: "Technical", question: "How do you design secure stateless JWT authentication, and how do you mitigate XSS and CSRF risks?", hint: "Discuss HttpOnly cookies, token rotation, and refresh token strategies." },
      { category: "System Design", question: "Explain how WebSockets differ from HTTP Long Polling and how you handle horizontal scaling with Redis Pub/Sub.", hint: "Consider connection statefulness across multiple server instances." },
      { category: "Coding Logic", question: "Walk me through how you would optimize a MongoDB collection with millions of documents for low-latency queries.", hint: "Discuss compound indexes, query execution plans, and pagination." },
    ],
    "default": [
      { category: "Technical", question: `What are the core design patterns and architecture paradigms you employ when building applications for ${role}?`, hint: "Think about separation of concerns, modularity, and scalability." },
      { category: "Coding Logic", question: "Describe a scenario where algorithmic time or space complexity became a bottleneck in your code and how you resolved it.", hint: "State Big-O before and after optimization." },
      { category: "Behavioral", question: "How do you handle disagreement with a teammate regarding technical architecture or code reviews?", hint: "Focus on data-driven discussions, empathy, and team alignment." },
    ],
  };

  const questions = fallbackBank[role] || fallbackBank["default"];
  const qIndex = history.length % questions.length;
  const selected = questions[qIndex];

  return {
    question_number: history.length + 1,
    category: selected.category,
    question: selected.question,
    hint: selected.hint,
  };
};

export const evaluateInterviewTranscript = async (role, level, transcript) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a Principal Engineering Lead evaluating a candidate's mock interview performance for "${role}" (${level}).
Transcript:
${transcript.map((t, i) => `Q${i + 1} (${t.category}): ${t.question}\nCandidate Answer: ${t.answer}`).join("\n\n")}

Provide an objective, in-depth scorecard. Return ONLY valid JSON:
{
  "overall_score": 84,
  "technical_accuracy_score": 86,
  "problem_solving_score": 82,
  "conceptual_depth_score": 85,
  "strengths": ["Clear articulation of core concepts", "Demonstrated hands-on familiarity"],
  "weaknesses": ["Could provide more quantified examples", "Can deepen explanations on edge cases"],
  "question_breakdown": [
    {
      "question": "Summary of Q",
      "rating": "Strong / Satisfactory / Needs Improvement",
      "feedback": "Specific feedback",
      "ideal_answer_summary": "What a top 5% candidate answer would include."
    }
  ],
  "hiring_recommendation": "Strong Hire | Lean Hire | Re-interview",
  "next_steps_roadmap": "Next 2 weeks preparation checklist..."
}`;
      const result = await model.generateContent(prompt);
      const parsed = parseJsonFromMarkdown(result.response.text());
      if (parsed) return parsed;
    } catch (err) {
      console.warn("Gemini evaluation error, using fallback report:", err.message);
    }
  }

  // Fallback evaluation scorecard
  const totalWords = transcript.reduce((acc, t) => acc + (t.answer || "").split(" ").length, 0);
  const avgWords = transcript.length ? Math.round(totalWords / transcript.length) : 0;
  const score = Math.min(95, Math.max(65, Math.round(60 + Math.min(avgWords, 100) * 0.3)));

  return {
    overall_score: score,
    technical_accuracy_score: Math.min(94, score + 2),
    problem_solving_score: Math.max(68, score - 3),
    conceptual_depth_score: score,
    strengths: [
      "Demonstrated good command over relevant terminology",
      "Logical structure in approaching technical explanations",
      "Composed and confident response delivery",
    ],
    weaknesses: [
      "Add more concrete real-world production engineering trade-offs",
      "State time/space complexity explicitly when presenting algorithmic solutions",
    ],
    question_breakdown: transcript.map((t) => ({
      question: t.question,
      rating: (t.answer || "").length > 80 ? "Strong" : "Satisfactory",
      feedback: "Answer covers the fundamentals well; highlight specific performance metrics next time.",
      ideal_answer_summary: "Structure answers with: 1) Definition & core purpose, 2) Technical mechanics, 3) Real-world use cases & trade-offs.",
    })),
    hiring_recommendation: score >= 80 ? "Strong Hire" : "Lean Hire",
    next_steps_roadmap: "Review distributed systems fundamentals, practice mock live coding on LeetCode Mediums, and rehearse STAR behavioral answers.",
  };
};

// -------------------------------------------------------------
// 4. 24/7 AI Career Guidance Chatbot (Module 7)
// -------------------------------------------------------------
export const generateCareerAdvice = async (message, chatHistory = [], userContext = {}) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are ConnectAlum's dedicated 24/7 AI Career Guidance Counselor for college students and alumni.
User context: Name: ${userContext.name || "Student"}, Role: ${userContext.role || "student"}, Department: ${userContext.department || "Engineering"}, Grad Batch: ${userContext.batch || "2026"}.

Conversation so far:
${chatHistory.map((m) => `${m.sender}: ${m.text}`).join("\n")}
User says: "${message}"

Give an inspiring, practical, actionable 2-3 paragraph answer with bullet points if applicable. Encourage networking with verified alumni on ConnectAlum and utilizing referrals.`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn("Gemini career chat error, using fallback counselor:", err.message);
    }
  }

  // Fallback intelligent career advisor responses
  const lower = message.toLowerCase();
  if (lower.includes("referral") || lower.includes("job")) {
    return `To maximize your chances of getting a referral on ConnectAlum:
1. **Target Relevant Alumni**: Look for alumni working at your dream company in your department via the Alumni Portal.
2. **Personalized Note**: Include a concise note referencing 1-2 projects matching the job description, your LeetCode/GitHub links, and the specific Job ID.
3. **ATS Resume**: Run your PDF resume through our AI Resume Diagnostic Analyzer first to score 80%+ before requesting a referral.
You can view open roles and request 1-click referrals directly in our Jobs section!`;
  }
  if (lower.includes("interview") || lower.includes("prepare")) {
    return `Here is a high-impact roadmap for interview preparation:
1. **Core DSA**: Practice Top 150 LeetCode patterns (Two Pointers, Sliding Window, Trees, Graphs, DP).
2. **System Design / Architecture**: Understand REST vs WebSockets, DB indexing, and caching.
3. **Practice with AI Mock Interviewer**: Launch our AI Mock Interview tool under the Student Portal to test your voice & technical responses in real-time.
4. **Book a 1-on-1 Alumni Session**: Schedule a mentoring slot with one of our verified alumni mentors!`;
  }
  return `Welcome to ConnectAlum Career Guidance! Whether you're aiming for product companies, campus placement drives, or transitioning into higher studies, here are 3 key steps:
• Refine your profile with GitHub and LeetCode handles so alumni can verify your work.
• Practice dynamic questions in our AI Mock Interviewer.
• Connect with graduating batches and explore open referral pipelines in the portal. How can I assist you specifically today?`;
};

// -------------------------------------------------------------
// 5. Community Q&A Instant AI Draft Answers (Module 7)
// -------------------------------------------------------------
export const generateQnaDraftAnswer = async (questionTitle, questionDescription) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are ConnectAlum's AI Assistant for college academic and career discussions.
A student posted this question in the Community Q&A Forum:
Title: "${questionTitle}"
Details: "${questionDescription}"

Provide an immediate, well-structured, authoritative draft answer to help the student right away while verified alumni prepare their answers. Include code or bullet points where relevant. Keep it under 250 words.`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn("Gemini Q&A draft error, using fallback answer:", err.message);
    }
  }

  return `🤖 **Instant AI Draft Answer**:
For questions regarding "${questionTitle}":
1. **Core Approach**: Clarify your system inputs and requirements before implementing the solution.
2. **Recommended Best Practice**: Validate constraints and test with edge cases (empty states, large inputs, race conditions).
3. **Next Steps**: Check out our Resources section for community study notes and reach out to verified alumni in our Community Chat channels!`;
};

// -------------------------------------------------------------
// 6. Alumni Stories 3-Bullet AI Executive Summary (Module 12)
// -------------------------------------------------------------
export const generateStorySummary = async (title, content) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an AI editor for ConnectAlum Alumni Stories.
Story Title: "${title}"
Story Content:
"""
${content.slice(0, 3000)}
"""

Extract exactly 3 concise, high-impact bullet points summarizing the core career lessons or achievements in this story.
Return ONLY valid JSON:
{
  "bullets": [
    "Key achievement or journey turning point",
    "Primary technical or career lesson learned",
    "Actionable takeaway for junior students"
  ]
}`;
      const result = await model.generateContent(prompt);
      const parsed = parseJsonFromMarkdown(result.response.text());
      if (parsed && Array.isArray(parsed.bullets)) return parsed.bullets;
    } catch (err) {
      console.warn("Gemini story summary error, using fallback bullets:", err.message);
    }
  }

  return [
    `Insights and experiences shared by alumnus regarding "${title}".`,
    "Key career transition and technical growth lessons learned from campus to corporate.",
    "Actionable recommendations for students preparing for upcoming placement seasons.",
  ];
};
