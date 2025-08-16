/**
 * Unit tests for unified cross-platform type definitions
 * Ensures type compatibility and cross-platform unified types work correctly
 */

import {
  UnifiedContext,
  EditorContext,
  ProjectContext,
  DeveloperContext,
  SystemContext,
  SessionContext,
  EditorType,
  ProjectType,
  FileType,
  DependencyType,
  DependencyStatus,
  BuildStatus,
  ThemeMode,
  ColorScheme,
  AutoSaveMode,
  SuggestionFrequency,
  FlowLevel,
  ActivityType,
  GoalType,
  GoalStatus,
  PlatformType,
  UnifiedObserverContext,
  ObserverCapabilities,
  EnvironmentType,
  UnifiedWhisper,
  WhisperType,
  WhisperPriority,
  DeliveryTiming,
  TimingStrategy,
  PresentationFormat,
  UnifiedError,
  UnifiedErrorType,
  RecoveryActionType,
  FallbackMode
} from '../unified';

describe('Unified Type Definitions', () => {
  describe('UnifiedContext interface', () => {
    it('should create a minimal unified context', () => {
      const context: Partial<UnifiedContext> = {
        platform: PlatformType.WEB,
        editor: {
          type: EditorType.MONACO,
          content: 'console.log("Hello, Sherlock Ω!");',
          language: 'typescript',
          cursor: { line: 1, column: 32 },
          metadata: {
            fileName: 'hello.ts',
            filePath: '/project/src/hello.ts',
            fileSize: 32,
            lastModified: new Date('2025-01-15T10:00:00Z'),
            encoding: 'utf-8',
            lineEndings: 'LF' as any,
            tabSize: 2,
            insertSpaces: true
          },
          capabilities: {
            syntaxHighlighting: true,
            autoCompletion: true,
            errorHighlighting: true,
            codeFormatting: true,
            refactoring: true,
            debugging: false,
            extensions: true
          }
        }
      };

      expect(context.platform).toBe(PlatformType.WEB);
      expect(context.editor?.type).toBe(EditorType.MONACO);
      expect(context.editor?.language).toBe('typescript');
    });
  });

  describe('UnifiedObserverContext interface', () => {
    it('should create valid observer context for web platform', () => {
      const observerContext: UnifiedObserverContext = {
        platform: PlatformType.WEB,
        capabilities: {
          backgroundProcessing: true,
          realTimeAnalysis: true,
          crossFileAnalysis: false,
          systemIntegration: false,
          networkAccess: true,
          persistentStorage: false
        },
        environment: {
          type: EnvironmentType.WEB_WORKER,
          resources: {
            memory: 100 * 1024 * 1024, // 100MB
            cpu: 25, // 25%
            storage: 10 * 1024 * 1024, // 10MB
            network: 1024 * 1024 // 1MB/s
          },
          constraints: {
            maxExecutionTime: 30000, // 30 seconds
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            allowedOperations: ['analyze', 'suggest', 'learn'],
            restrictedAPIs: ['file-system', 'system-commands']
          },
          communication: {
            type: 'MESSAGE_PASSING' as any,
            protocol: 'JSON_RPC' as any,
            serialization: 'JSON' as any,
            compression: true
          }
        },
        configuration: {
          sensitivity: 'MEDIUM' as any,
          frequency: 'HIGH' as any,
          scope: {
            files: {
              include: ['*.ts', '*.js'],
              exclude: ['node_modules/**'],
              patterns: ['src/**/*']
            },
            functions: {
              include: ['*'],
              exclude: [],
              patterns: []
            },
            dependencies: {
              include: ['@types/*'],
              exclude: ['**/test/**'],
              patterns: []
            },
            timeRange: {
              duration: 3600000 // 1 hour
            }
          },
          filters: [
            {
              type: 'FILE_TYPE' as any,
              condition: 'typescript',
              action: 'PRIORITIZE' as any
            }
          ]
        }
      };

      expect(observerContext.platform).toBe(PlatformType.WEB);
      expect(observerContext.capabilities.backgroundProcessing).toBe(true);
      expect(observerContext.environment.type).toBe(EnvironmentType.WEB_WORKER);
      expect(observerContext.configuration.sensitivity).toBe('MEDIUM');
    });
  });

  describe('UnifiedWhisper interface', () => {
    it('should create valid whisper for pattern harmony', () => {
      const whisper: UnifiedWhisper = {
        id: 'whisper-123',
        type: WhisperType.PATTERN_HARMONY,
        content: {
          title: 'Mathematical Harmony Detected',
          message: 'Consider using a more elegant functional approach for this data transformation.',
          references: []
        },
        metadata: {
          observer: 'pattern-keeper',
          confidence: 0.85,
          priority: WhisperPriority.MEDIUM,
          category: 'MAINTAINABILITY' as any,
          tags: ['functional-programming', 'array-methods', 'refactoring'],
          timestamp: new Date('2025-01-15T10:15:00Z')
        },
        delivery: {
          timing: {
            strategy: TimingStrategy.NEXT_PAUSE,
            delay: 2000, // 2 seconds
            conditions: []
          },
          presentation: {
            format: PresentationFormat.TOOLTIP,
            animation: {
              enabled: true,
              type: 'FADE' as any,
              duration: 300,
              easing: 'EASE_IN_OUT' as any
            },
            styling: {
              theme: 'whispering-dark',
              colors: {
                primary: '#4A90E2',
                secondary: '#7ED321',
                accent: '#F5A623',
                background: '#2C2C2C',
                text: '#FFFFFF',
                border: '#4A4A4A'
              },
              typography: {
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                fontWeight: 'NORMAL' as any,
                lineHeight: 1.4
              },
              spacing: {
                padding: 12,
                margin: 8,
                borderRadius: 6,
                borderWidth: 1
              }
            },
            accessibility: {
              screenReaderText: 'Pattern harmony suggestion available',
              keyboardNavigation: true,
              highContrast: false,
              focusIndicator: true
            }
          },
          persistence: {
            dismissible: true,
            autoHide: true,
            hideDelay: 10000, // 10 seconds
            rememberChoice: true
          },
          platform: {
            web: {
              container: '.monaco-editor',
              zIndex: 1000,
              responsive: true,
              touchOptimized: false
            },
            desktop: {
              window: {
                modal: false,
                resizable: false,
                minimizable: false,
                alwaysOnTop: true
              },
              systemIntegration: {
                enabled: false,
                icon: '',
                sound: false,
                actionButtons: []
              }
            }
          }
        },
        interaction: {
          actions: [
            {
              id: 'accept',
              label: 'Apply Suggestion',
              type: 'ACCEPT' as any,
              handler: 'applyCodeSuggestion',
              confirmation: false
            }
          ],
          feedback: {
            enabled: true,
            types: ['RATING' as any, 'COMMENT' as any],
            collection: {
              method: 'INLINE' as any,
              timing: 'ON_ACTION' as any,
              optional: true
            }
          },
          analytics: {
            enabled: true,
            events: [],
            privacy: {
              anonymize: true,
              retention: 30, // 30 days
              consent: true
            }
          }
        }
      };

      expect(whisper.type).toBe(WhisperType.PATTERN_HARMONY);
      expect(whisper.metadata.observer).toBe('pattern-keeper');
      expect(whisper.delivery.timing.strategy).toBe(TimingStrategy.NEXT_PAUSE);
      expect(whisper.interaction.actions).toHaveLength(1);
    });
  });

  describe('Type Compatibility and Integration', () => {
    it('should ensure unified types work with platform-specific types', () => {
      // Test that unified types can reference platform-specific enums
      const webPlatform: PlatformType = PlatformType.WEB;
      const desktopPlatform: PlatformType = PlatformType.DESKTOP;

      expect(webPlatform).toBe('WEB');
      expect(desktopPlatform).toBe('DESKTOP');
    });

    it('should validate enum completeness', () => {
      // Ensure all important enums have expected values
      const editorTypes = Object.values(EditorType);
      expect(editorTypes).toContain('MONACO');
      expect(editorTypes).toContain('NATIVE');
      expect(editorTypes).toContain('TERMINAL');

      const projectTypes = Object.values(ProjectType);
      expect(projectTypes).toContain('TYPESCRIPT');
      expect(projectTypes).toContain('JAVASCRIPT');
      expect(projectTypes).toContain('PYTHON');

      const whisperTypes = Object.values(WhisperType);
      expect(whisperTypes).toContain('PATTERN_HARMONY');
      expect(whisperTypes).toContain('COMPUTATIONAL_POETRY');
      expect(whisperTypes).toContain('COSMIC_CONNECTION');

      const flowLevels = Object.values(FlowLevel);
      expect(flowLevels).toContain('NONE');
      expect(flowLevels).toContain('LIGHT');
      expect(flowLevels).toContain('MODERATE');
      expect(flowLevels).toContain('DEEP');
      expect(flowLevels).toContain('PEAK');
    });

    it('should support cross-platform context creation', () => {
      // Test that the same context structure works for different platforms
      const createMinimalContext = (platform: PlatformType): Partial<UnifiedContext> => ({
        platform,
        editor: {
          type: platform === PlatformType.WEB ? EditorType.MONACO : EditorType.NATIVE,
          content: '',
          language: 'typescript',
          cursor: { line: 1, column: 1 },
          metadata: {
            fileName: 'test.ts',
            filePath: '/test.ts',
            fileSize: 0,
            lastModified: new Date(),
            encoding: 'utf-8',
            lineEndings: 'LF' as any,
            tabSize: 2,
            insertSpaces: true
          },
          capabilities: {
            syntaxHighlighting: true,
            autoCompletion: true,
            errorHighlighting: true,
            codeFormatting: true,
            refactoring: platform === PlatformType.DESKTOP,
            debugging: platform === PlatformType.DESKTOP,
            extensions: true
          }
        }
      });

      const webContext = createMinimalContext(PlatformType.WEB);
      const desktopContext = createMinimalContext(PlatformType.DESKTOP);

      expect(webContext.platform).toBe(PlatformType.WEB);
      expect(webContext.editor?.type).toBe(EditorType.MONACO);
      expect(webContext.editor?.capabilities.debugging).toBe(false);

      expect(desktopContext.platform).toBe(PlatformType.DESKTOP);
      expect(desktopContext.editor?.type).toBe(EditorType.NATIVE);
      expect(desktopContext.editor?.capabilities.debugging).toBe(true);
    });
  });
});