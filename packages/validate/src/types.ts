export type FrnlValidationSeverity = 'error' | 'warning';

export interface FrnlValidationDiagnostic {
  ruleId: string;
  filePath: string;
  line?: number;
  message: string;
  severity: FrnlValidationSeverity;
}

export interface FrnlValidationResult {
  errors: FrnlValidationDiagnostic[];
  warnings: FrnlValidationDiagnostic[];
  filesChecked: number;
  passed: boolean;
}
