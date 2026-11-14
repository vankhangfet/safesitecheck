import { mapRiskToLabel } from './mapping';
import { failureReason, optionReason, signalReasons } from './reasons';
import {
  NO_SIGNALS,
  assertValidVerdict,
  type FailureKind,
  type PageSignals,
  type PageVisit,
  type RiskAnswer,
  type Verdict,
  type VerdictSource,
} from '../shared/types';

export interface VerdictContext {
  visit: PageVisit;
  attemptId: string;
  verdictId: string;
  source: VerdictSource;
  now: number;
}

/** A readable answer becomes one label with its fixed reason (BR2.2, BR2.3). */
export function verdictFromAnswer(answer: RiskAnswer, context: VerdictContext): Verdict {
  const label = mapRiskToLabel(answer);
  const signals: PageSignals = context.visit.signals ?? NO_SIGNALS;
  const verdict: Verdict = {
    verdictId: context.verdictId,
    visitId: context.visit.visitId,
    attemptId: context.attemptId,
    strippedAddress: context.visit.strippedAddress,
    label,
    reasonShort: optionReason(answer.choice, label),
    source: context.source,
    checkedAt: context.now,
  };
  const more = signalReasons(signals);
  if (more !== undefined) verdict.reasonMore = more;
  return assertValidVerdict(verdict);
}

/** Every failure ends as Could not check with its own reason (BR2.1, NFR6.2). */
export function verdictFromFailure(kind: FailureKind, context: VerdictContext): Verdict {
  return assertValidVerdict({
    verdictId: context.verdictId,
    visitId: context.visit.visitId,
    attemptId: context.attemptId,
    strippedAddress: context.visit.strippedAddress,
    label: 'could-not-check',
    reasonShort: failureReason(kind),
    failureKind: kind,
    source: context.source,
    checkedAt: context.now,
  });
}
