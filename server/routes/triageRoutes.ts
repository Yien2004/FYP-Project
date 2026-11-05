import { Router } from 'express';
import { evaluateDeterministicRules } from '../services/triageEngine';
import { generateCareyResponse } from '../services/geminiService';
import * as db from '../../db';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    // 1. 兼容所有前端可能传入的字段名
    const rawInput = req.body.message || req.body.text || req.body.prompt || req.body.query || req.body.symptoms || '';

    console.log('--------------------------------------------------');
    console.log('[DEBUG] Received Body:', JSON.stringify(req.body));
    console.log('[DEBUG] Extracted Symptom Text:', rawInput);

    if (!rawInput || typeof rawInput !== 'string' || rawInput.trim() === '') {
      console.error('[DEBUG ERROR] Symptom text is empty or undefined!');
      return res.status(400).json({ error: 'Empty symptom input' });
    }

    // 2. 传入规则引擎
    const triageResult = evaluateDeterministicRules(rawInput.trim(), req.body.patientInfo, req.body.region);
    console.log('[DEBUG] Triage Evaluation Result:', triageResult);

    // Carey AI Red-Flag Intercept Audit Logging
    if (triageResult.isEmergency) {
      try {
        await db.addEmergencyInterceptLog({
          patient_id: req.body.patientInfo?.id || req.body.patientId || null,
          raw_symptoms: rawInput.trim(),
          matched_keywords: triageResult.matchedKeywords || [triageResult.intent || 'EMERGENCY_TRIGGER'],
          severity_score: triageResult.severityScore || 9,
          facility_id: triageResult.suggestedFacilityId || 1,
          intercept_action: 'REDIRECT_999_A&E'
        });
      } catch (logErr: any) {
        console.warn("Carey intercept log warning:", logErr.message);
      }
    }

    // 3. 生成展示回复（急症直接返回警报，非急症调用 Gemini 润色）
    const careyReply = await generateCareyResponse(rawInput.trim(), triageResult);

    return res.json({
      success: true,
      intent: triageResult.intent,
      isEmergency: triageResult.isEmergency,
      isNonMedical: Boolean(triageResult.isNonMedical),
      severityScore: triageResult.severityScore,
      recommendedSpecialty: triageResult.recommendedSpecialty,
      facilityId: triageResult.suggestedFacilityId,
      facilityName: triageResult.facilityName,
      preliminaryAdvice: triageResult.preliminaryAdvice,
      reply: careyReply,
      language: triageResult.language,
      activeAppointment: triageResult.activeAppointment
    });
  } catch (error) {
    console.error('[TRIAGE ROUTE FATAL ERROR]:', error);
    return res.status(500).json({
      success: false,
      isEmergency: false,
      reply: 'An error occurred during triage analysis.'
    });
  }
});

export default router;
