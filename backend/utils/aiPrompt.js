// backend/utils/aiPrompt.js

/**
 * Constructs the user prompt for the main analysis call to the OpenAI API.
 * @param {object} review - The medication review object from the database.
 * @returns {string} The formatted prompt string.
 */
function constructAIPrompt(review) {
    return `
You are an expert hospital pharmacist performing a medication review. Your task is to analyze patient data and produce a structured JSON object.

**Core Directives:**
- Your entire output MUST be a single, valid JSON object.
- **Be exhaustive.** Identify all potential MRPs and interventions.

**JSON Output Structure:**
You must conform to this exact JSON structure:
\`\`\`json
{
  "patient_summary": {
    "medications_used": "A comma-separated list of the key medications you identified, INCLUDING THEIR FREQUENCY (e.g., 'Metoprolol 100mg twice daily', 'Amlodipine 10mg once daily').",
    "lab_data_used": "A comma-separated list of the key lab values you identified.",
    "vitals_used": "A comma-separated list of the key vital signs you identified.",
    "problems_used": "A comma-separated list of the key problems you identified."
  },
  "medication_score": {
    "score": "An integer between 0 and 100 representing the optimality of the current medication regimen. 100 is perfect, 0 is extremely dangerous/ineffective.",
    "mrp_count": "An integer representing the total number of MRPs you identified.",
    "rationale": "A brief, one-sentence explanation for why you assigned this score."
  },
  "mrps": [
    {
      "id": "mrp-1",
      "problem_summary": "A brief summary of the MRP.",
      "analysis_summary": "A concise analysis of the drug-problem link.",
      "severity_color": "A string: 'red', 'orange', 'yellow', or 'green'.",
      "detailed_assessment": "An in-depth clinical rationale for the problem.",
      "advice": "Clear, actionable advice for the doctor."
    }, {...include more mrps here...}
  ],
  "broader_interventions": [
    {
      "id": "intervention-1",
      "intervention_summary": "A brief summary of the broader intervention.",
      "priority_color": "A string: 'high', 'medium', or 'low'.",
      "detailed_explanation": "An in-depth explanation of why this intervention is important."
    }, {...include more interventions here...}
  ]
}
\`\`\`

**Color/Priority Guides:**
- MRP Severity Color: 'red' (urgent), 'orange' (high priority), 'yellow' (medium), 'green' (low/optimization).
- Intervention Priority Color: 'high' (important safety/efficacy), 'medium' (standard optimization), 'low' (best practice).

**Final Checklist Before Responding:**
- Have I checked every medication against every problem?
- Have I considered the patient's age and renal function for every drug?
- Are there any high-risk medications (e.g., benzodiazepines, opioids) that need a specific intervention?
- Are there any obvious drug-drug interactions I missed?
- Is the dose for every medication appropriate?
- Have I provided a detailed explanation for every single point?

---

**Patient Data:**

**PROBLEMS:**
${review.problems || 'Not provided'}

**MEDICATION:**
${review.medication || 'Not provided'}

**LABORATORY DATA:**
${review.labData || 'Not provided'}

**VITAL FUNCTIONS:**
${review.vitalData || 'Not provided'}

**PATIENT HISTORY:**
${review.history || 'Not provided'}

---
Now, generate the complete and exhaustive JSON object based on the provided data and your expert analysis.
`;
}


/**
 * Constructs the prompt for generating a formal letter from an AI analysis.
 * @param {object} aiResponse - The structured JSON response from the first AI call.
 * @param {string} addressee - The name/title of the person the letter is addressed to.
 * @param {string} language - The language to write the letter in.
 * @returns {string} The formatted prompt string.
 */
function constructLetterPrompt(aiResponse, addressee, language) {
    let mrpText = (aiResponse.mrps || [])
        .map((mrp, i) => `Problem ${i + 1}: ${mrp.problem_summary}\n   - Assessment: ${mrp.detailed_assessment}\n   - Advice: ${mrp.advice}`)
        .join('\n\n');
    let interventionText = (aiResponse.broader_interventions || [])
        .map((int, i) => `Intervention ${i + 1}: ${int.intervention_summary}\n   - Rationale: ${int.detailed_explanation}`)
        .join('\n\n');

    return `
You are a professional medical writer. Your task is to convert the following structured medication review analysis into a formal, concise, and polite letter addressed to a doctor.

**Primary Language:** You MUST write the entire letter in **${language}**.

**Letter Formatting Rules:**
- Address the letter to: ${addressee}
- The tone must be professional, collaborative, and respectful.
- Start with a brief introduction stating the patient context.
- Structure the body of the letter with clear headings for "Medicine-Related Problems (MRPs)" and "Other Recommendations". Use the ${language} translation for these headings.
- Under each heading, list the points from the provided analysis, translating them naturally into ${language}.
- Use appropriate line breaks for readability.
- Conclude with a polite closing and sign off as "The Hospital Pharmacist" (or its ${language} equivalent).
- Do not add any text or explanation before the salutation or after the sign-off.

---
**ANALYSIS DATA TO CONVERT (Translate this content into ${language} for the letter):**

**Identified MRPs:**
${mrpText || 'None identified.'}

**Broader Interventions:**
${interventionText || 'None identified.'}
---

Now, please generate the formal letter in ${language} based on this data.
`;
}

function constructInteractionPrompt(medicationList) {
    return `
You are a clinical pharmacologist. Your task is to analyze a list of medications and generate a structured JSON object detailing their pairwise interactions.

**Core Directives:**
- Your entire output MUST be a single, valid JSON object.
- Identify all clinically relevant pairwise drug-drug interactions.
- If no significant interaction exists between a pair, mark it as compatible.

**JSON Output Structure:**
\`\`\`json
{
  "drugs": [ "Drug A", "Drug B", "Drug C" ],
  "matrix": {
    "Drug A": {
      "Drug B": { "compatible": false, "explanation": "Brief reason for the interaction." },
      "Drug C": { "compatible": true, "explanation": "No significant interaction." }
    },
    "Drug B": {
      "Drug C": { "compatible": false, "explanation": "Brief reason for the interaction." }
    }
  },
  "crucial_interactions": [
    {
      "drugs": ["Drug A", "Drug B"],
      "summary": "A one-sentence summary of the most critical interaction."
    }
  ]
}
\`\`\`

---
**Medication List to Analyze:**

${medicationList}
---

Now, generate the interaction JSON object.
`;
}


module.exports = {
    constructAIPrompt,
    constructLetterPrompt,
    constructInteractionPrompt // Ensure it's exported
};