
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  fileLoadTime?: number;
  uiFrameRate?: number;
  analysisSpeed?: number;
  successRate?: number;
}
