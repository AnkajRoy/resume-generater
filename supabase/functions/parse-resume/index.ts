// Supabase Edge Function: parse-resume
//
// Receives raw text extracted client-side from an uploaded PDF/DOCX resume,
// sends it to Groq's OpenAI-compatible API (open-weight Llama model) to
// extract structured fields, and returns JSON matching the app's ResumeData
// shape. The Groq API key stays server-side as a function secret — it is
// never exposed to the browser.
//
// Deploy: supabase functions deploy parse-resume
// Secret: supabase secrets set GROQ_API_KEY=your_key_here

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You extract structured resume data from raw resume text and return ONLY a JSON object matching this exact shape (no extra commentary, no markdown fences):

{
  "personalInfo": { "name": "", "title": "", "phone": "", "email": "", "linkedin": "", "github": "", "leetcode": "", "location": "" },
  "summary": "",
  "experiences": [
    { "company": "", "role": "", "dateRange": "", "subtitle": "",
      "subsections": [ { "title": "", "bullets": ["", ""] } ] }
  ],
  "projects": [ { "name": "", "description": "", "githubUrl": "", "githubText": "" } ],
  "skills": [ { "label": "", "value": "" } ],
  "education": { "degree": "", "institution": "", "year": "", "cgpa": "", "location": "" },
  "achievements": [""]
}

Rules:
- Use "" or [] for anything not present in the source text. Never fabricate facts, numbers, dates, or company names that aren't in the text.
- Group each job's bullet points into one or more "subsections" under that experience. If the original resume has no clear sub-headings within a job, put all its bullets into a single subsection with an empty "title".
- "skills" should be grouped by category if the resume has categories (e.g. "Languages", "Frameworks"); otherwise put everything under one entry with label "Skills".
- githubUrl/githubText should stay empty unless an actual repo link is present.
- Keep bullet text close to the original wording — don't rewrite or embellish it.
- Output must be valid JSON and nothing else.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length < 30) {
      return new Response(JSON.stringify({ error: 'No usable text was provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'Resume import is not configured yet on the server.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = Deno.env.get('GROQ_MODEL') ?? 'openai/gpt-oss-120b';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.slice(0, 12000) },
        ],
      }),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      return new Response(JSON.stringify({ error: 'AI extraction failed.', detail }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content ?? '{}';

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: 'AI returned malformed data.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
