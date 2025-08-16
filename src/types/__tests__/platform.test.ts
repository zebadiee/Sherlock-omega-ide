/**
 * Unit tests for platform-specific type definitions
 * Ensures type compatibility and platform-specific variations work correctly
 */

import {
  PlatformType,
  PlatformCapabilities,
  FileSystemCapabilities,
  StorageCapabilities,
  ProcessingCapabilities,
  UICapabilities,
  NetworkCapabilities,
  SystemCapabilities,
  WebEditorConfig,
  DesktopEditorConfig,
  WebStorageConfig,
  DesktopStorageConfig,
  WebObserverConfig,
  DesktopObserverConfig,
  WebError,
  DesktopError,
  FileOperation,
  StorageType,
  UIFramework,
  PermissionLevel,
  MonacoTheme,
  NativeFramework,
  DatabaseType,
  WebErrorType,
  DesktopErrorType
} from '../platform';

describe('Platform Type Definitions', () => {
  describe('PlatformType enum', () => {
    it('should define all platform types', () => {
      expect(PlatformType.WEB).toBe('WEB');
      expect(PlatformType.DESKTOP).toBe('DESKTOP');
      expect(PlatformType.HYBRID).toBe('HYBRID');
    });

    it('should be exhaustive', () => {
      const platformTypes = Object.values(PlatformType);
      expect(platformTypes).toHaveLength(3);
      expect(platformTypes).toContain('WEB');
      expect(platformTypes).toContain('DESKTOP');
      expect(platformTypes).toContain('HYBRID');
    });
  });

  describe('PlatformCapabilities interface', () => {
    it('should create valid web platform capabilities', () => {
      const webCapabilities: PlatformCapabilities = {
        type: PlatformType.WEB,
        fileSystem: {
          canReadFiles: true,
          canWriteFiles: true,
          canWatchFiles: false,
          canExecuteCommands: false,
          canAccessSystemPaths: false,
          supportedOperations: [FileOperation.READ, FileOperation.WRITE],
          maxFileSize: 50 * 1024 * 1024, // 50MB
          supportedFormats: ['txt', 'js', 'ts', 'json', 'md']
        },
        storage: {
          persistent: false,
          maxSize: 10 * 1024 * 1024, // 10MB
          quotaManaged: true,
          supportedTypes: [StorageType.LOCAL_STORAGE, StorageType.INDEXED_DB],
          encryption: false,
          compression: true
        },
        processing: {
          multiThreading: true,
          webWorkers: true,
          childProcesses: false,
          maxConcurrency: 4,
          backgroundProcessing: true,
          resourceLimits: {
            maxMemory: 100 * 1024 * 1024, // 100MB
            maxCpuTime: 5000, // 5 seconds
            maxNetworkRequests: 100,
            maxFileHandles: 50
          }
        },
        ui: {
          framework: UIFramework.REACT,
          nativeIntegration: false,
          customStyling: true,
          animations: true,
          notifications: {
            toast: true,
            system: false,
            persistent: false,
            interactive: true,
            scheduling: false
          },
          accessibility: {
            screenReader: true,
            highContrast: true,
            keyboardNavigation: true,
            voiceControl: false,
            customization: true
          }
        },
        network: {
          httpRequests: true,
          websockets: true,
          cors: true,
          proxy: false,
          offline: true,
          rateLimiting: {
            requestsPerSecond: 10,
            burstLimit: 50,
            backoffStrategy: 'EXPONENTIAL' as any
          }
        },
        system: {
          osIntegration: false,
          environmentVariables: false,
          processManagement: false,
          systemCommands: false,
          hardwareAccess: false,
          permissions: PermissionLevel.LIMITED
        }
      };

      expect(webCapabilities.type).toBe(PlatformType.WEB);
      expect(webCapabilities.fileSystem.canExecuteCommands).toBe(false);
      expect(webCapabilities.processing.webWorkers).toBe(true);
      expect(webCapabilities.ui.framework).toBe(UIFramework.REACT);
      expect(webCapabilities.system.permissions).toBe(PermissionLevel.LIMITED);
    });

    it('should create valid desktop platform capabilities', () => {
      const desktopCapabilities: PlatformCapabilities = {
        type: PlatformType.DESKTOP,
        fileSystem: {
          canReadFiles: true,
          canWriteFiles: true,
          canWatchFiles: true,
          canExecuteCommands: true,
          canAccessSystemPaths: true,
          supportedOperations: Object.values(FileOperation),
          maxFileSize: 1024 * 1024 * 1024, // 1GB
          supportedFormats: ['*'] // All formats
        },
        storage: {
          persistent: true,
          maxSize: 100 * 1024 * 1024 * 1024, // 100GB
          quotaManaged: false,
          supportedTypes: [StorageType.FILE_SYSTEM, StorageType.DATABASE],
          encryption: true,
          compression: true
        },
        processing: {
          multiThreading: true,
          webWorkers: false,
          childProcesses: true,
          maxConcurrency: 16,
          backgroundProcessing: true,
          resourceLimits: {
            maxMemory: 8 * 1024 * 1024 * 1024, // 8GB
            maxCpuTime: 0, // No limit
            maxNetworkRequests: 1000,
            maxFileHandles: 1000
          }
        },
        ui: {
          framework: UIFramework.ELECTRON,
          nativeIntegration: true,
          customStyling: true,
          animations: true,
          notifications: {
            toast: true,
            system: true,
            persistent: true,
            interactive: true,
            scheduling: true
          },
          accessibility: {
            screenReader: true,
            highContrast: true,
            keyboardNavigation: true,
            voiceControl: true,
            customization: true
          }
        },
        network: {
          httpRequests: true,
          websockets: true,
          cors: false,
          proxy: true,
          offline: true,
          rateLimiting: {
            requestsPerSecond: 100,
            burstLimit: 500,
            backoffStrategy: 'ADAPTIVE' as any
          }
        },
        system: {
          osIntegration: true,
          environmentVariables: true,
          processManagement: true,
          systemCommands: true,
          hardwareAccess: true,
          permissions: PermissionLevel.ADMINISTRATOR
        }
      };

      expect(desktopCapabilities.type).toBe(PlatformType.DESKTOP);
      expect(desktopCapabilities.fileSystem.canExecuteCommands).toBe(true);
      expect(desktopCapabilities.processing.childProcesses).toBe(true);
      expect(desktopCapabilities.ui.framework).toBe(UIFramework.ELECTRON);
      expect(desktopCapabilities.system.permissions).toBe(PermissionLevel.ADMINISTRATOR);
    });
  });

  describe('WebEditorConfig interface', () => {
    it('should create valid Monaco editor configuration', () => {
      const webConfig: WebEditorConfig = {
        monacoVersion: '0.44.0',
        theme: {
          name: 'whispering-dark',
          base: 'vs-dark',
          inherit: true,
          rules: [
            {
              token: 'comment',
              foreground: '6A9955',
              fontStyle: 'italic'
            },
            {
              token: 'keyword',
              foreground: '569CD6',
              fontStyle: 'bold'
            }
          ],
          colors: {
            'editor.background': '#1E1E1E',
            'editor.foreground': '#D4D4D4',
            'editorLineNumber.foreground': '#858585'
          }
        },
        workers: {
          enabled: true,
          maxWorkers: 4,
          workerPaths: {
            typescript: '/workers/ts.worker.js',
            javascript: '/workers/js.worker.js',
            json: '/workers/json.worker.js'
          },
          fallbackToMainThread: true
        },
        extensions: [
          {
            id: 'whispering-suggestions',
            name: 'Whispering Suggestions',
            version: '1.0.0',
            enabled: true,
            config: {
              sensitivity: 'medium',
              timing: 'contextual'
            }
          }
        ],
        performance: {
          lazyLoading: true,
          codeMinification: true,
          assetOptimization: true,
          caching: {
            enabled: true,
            strategy: 'STALE_WHILE_REVALIDATE' as any,
            maxSize: 50 * 1024 * 1024, // 50MB
            ttl: 3600 // 1 hour
          }
        }
      };

      expect(webConfig.monacoVersion).toBe('0.44.0');
      expect(webConfig.theme.base).toBe('vs-dark');
      expect(webConfig.workers.enabled).toBe(true);
      expect(webConfig.extensions).toHaveLength(1);
      expect(webConfig.performance.lazyLoading).toBe(true);
    });
  });

  describe('DesktopEditorConfig interface', () => {
    it('should create valid desktop editor configuration', () => {
      const desktopConfig: DesktopEditorConfig = {
        nativeFramework: NativeFramework.ELECTRON,
        systemIntegration: {
          fileAssociations: [
            {
              extension: '.ts',
              description: 'TypeScript File',
              icon: 'typescript.ico',
              defaultAction: 'open'
            }
          ],
          contextMenus: true,
          systemTray: true,
          autoStart: false,
          urlProtocols: ['sherlock-omega']
        },
        performance: {
          multiProcessing: true,
          hardwareAcceleration: true,
          memoryOptimization: true,
          diskCaching: true
        },
        security: {
          sandboxing: true,
          codeSignature: true,
          permissions: [
            {
              type: 'FILE_SYSTEM_READ' as any,
              granted: true,
              reason: 'Required for project file access'
            }
          ],
          encryption: {
            enabled: true,
            algorithm: 'AES_256' as any,
            keyManagement: 'SYSTEM_KEYSTORE' as any
          }
        }
      };

      expect(desktopConfig.nativeFramework).toBe(NativeFramework.ELECTRON);
      expect(desktopConfig.systemIntegration.fileAssociations).toHaveLength(1);
      expect(desktopConfig.performance.multiProcessing).toBe(true);
      expect(desktopConfig.security.sandboxing).toBe(true);
    });
  });

  describe('Storage Configuration Types', () => {
    it('should create valid web storage configuration', () => {
      const webStorage: WebStorageConfig = {
        localStorage: {
          enabled: true,
          maxSize: 10 * 1024 * 1024, // 10MB
          compression: true,
          encryption: false,
          keyPrefix: 'sherlock-omega-'
        },
        sessionStorage: {
          enabled: true,
          maxSize: 5 * 1024 * 1024, // 5MB
          autoCleanup: true,
          keyPrefix: 'session-'
        },
        indexedDB: {
          enabled: true,
          databaseName: 'SherlockOmegaDB',
          version: 1,
          stores: [
            {
              name: 'projects',
              keyPath: 'id',
              autoIncrement: false,
              indexes: [
                {
                  name: 'name',
                  keyPath: 'name',
                  unique: false,
                  multiEntry: false
                }
              ]
            }
          ],
          maxSize: 50 * 1024 * 1024 // 50MB
        },
        quotaManagement: {
          enabled: true,
          warningThreshold: 80, // 80%
          cleanupStrategy: 'OLDEST_FIRST' as any,
          userNotification: true
        }
      };

      expect(webStorage.localStorage.enabled).toBe(true);
      expect(webStorage.indexedDB.databaseName).toBe('SherlockOmegaDB');
      expect(webStorage.quotaManagement.warningThreshold).toBe(80);
    });

    it('should create valid desktop storage configuration', () => {
      const desktopStorage: DesktopStorageConfig = {
        fileSystem: {
          basePath: '~/.sherlock-omega',
          structure: {
            config: 'config',
            data: 'data',
            cache: 'cache',
            logs: 'logs',
            temp: 'temp',
            backup: 'backup'
          },
          permissions: {
            owner: { read: true, write: true, execute: true },
            group: { read: true, write: false, execute: false },
            others: { read: false, write: false, execute: false }
          },
          compression: true,
          encryption: true
        },
        database: {
          type: DatabaseType.SQLITE,
          connectionString: 'sqlite:///~/.sherlock-omega/data/sherlock.db',
          poolSize: 10,
          timeout: 5000,
          encryption: true
        },
        backup: {
          enabled: true,
          frequency: 'DAILY' as any,
          retention: 30, // 30 days
          compression: true,
          encryption: true,
          location: {
            type: 'LOCAL_DIRECTORY' as any,
            path: '~/.sherlock-omega/backup'
          }
        },
        synchronization: {
          enabled: false,
          strategy: 'PERIODIC' as any,
          conflictResolution: 'TIMESTAMP_WINS' as any,
          endpoints: []
        }
      };

      expect(desktopStorage.fileSystem.basePath).toBe('~/.sherlock-omega');
      expect(desktopStorage.database.type).toBe(DatabaseType.SQLITE);
      expect(desktopStorage.backup.enabled).toBe(true);
    });
  });

  describe('Observer Configuration Types', () => {
    it('should create valid web observer configuration', () => {
      const webObserver: WebObserverConfig = {
        workers: {
          enabled: true,
          maxWorkers: 4,
          workerTimeout: 30000, // 30 seconds
          memoryLimit: 100 * 1024 * 1024, // 100MB
          scriptPaths: {
            'pattern-keeper': '/workers/pattern-keeper.worker.js',
            'systems-philosopher': '/workers/systems-philosopher.worker.js',
            'cosmic-cartographer': '/workers/cosmic-cartographer.worker.js'
          }
        },
        performance: {
          analysisInterval: 1000, // 1 second
          batchSize: 10,
          throttling: {
            enabled: true,
            maxOperationsPerSecond: 10,
            burstLimit: 50,
            cooldownPeriod: 5000 // 5 seconds
          },
          optimization: {
            lazyAnalysis: true,
            incrementalUpdates: true,
            caching: true,
            compression: true
          }
        },
        fallback: {
          enabled: true,
          triggers: [
            {
              condition: 'WORKER_FAILURE' as any,
              threshold: 3,
              action: 'MAIN_THREAD_PROCESSING' as any
            }
          ],
          degradedMode: {
            analysisDepth: 'BASIC' as any,
            updateFrequency: 5000, // 5 seconds
            featureDisabling: ['cross-file-analysis', 'deep-pattern-matching']
          }
        },
        communication: {
          messageFormat: 'JSON' as any,
          serialization: {
            format: 'JSON' as any,
            compression: true,
            encryption: false
          },
          errorHandling: {
            retryAttempts: 3,
            retryDelay: 1000, // 1 second
            circuitBreaker: {
              enabled: true,
              failureThreshold: 5,
              recoveryTimeout: 30000, // 30 seconds
              halfOpenMaxCalls: 3
            },
            logging: {
              level: 'INFO' as any,
              destination: 'CONSOLE' as any,
              format: 'JSON' as any,
              retention: 7 // 7 days
            }
          }
        }
      };

      expect(webObserver.workers.enabled).toBe(true);
      expect(webObserver.performance.analysisInterval).toBe(1000);
      expect(webObserver.fallback.enabled).toBe(true);
      expect(webObserver.communication.messageFormat).toBe('JSON');
    });

    it('should create valid desktop observer configuration', () => {
      const desktopObserver: DesktopObserverConfig = {
        processes: {
          enabled: true,
          maxProcesses: 8,
          processTimeout: 60000, // 60 seconds
          memoryLimit: 1024 * 1024 * 1024, // 1GB
          cpuLimit: 80 // 80%
        },
        performance: {
          analysisInterval: 500, // 0.5 seconds
          batchSize: 50,
          parallelization: {
            enabled: true,
            maxThreads: 8,
            workStealing: true,
            loadBalancing: 'LEAST_LOADED' as any
          },
          optimization: {
            nativeLibraries: true,
            hardwareAcceleration: true,
            memoryMapping: true,
            diskCaching: true
          }
        },
        systemIntegration: {
          fileWatching: {
            enabled: true,
            recursive: true,
            filters: ['*.ts', '*.js', '*.json'],
            debounceTime: 100 // 100ms
          },
          processMonitoring: {
            enabled: true,
            targetProcesses: ['node', 'npm', 'yarn'],
            metrics: ['CPU_USAGE' as any, 'MEMORY_USAGE' as any],
            alertThresholds: {
              'CPU_USAGE': 90,
              'MEMORY_USAGE': 85
            }
          },
          networkMonitoring: {
            enabled: false,
            interfaces: [],
            protocols: [],
            trafficAnalysis: false
          }
        },
        communication: {
          ipc: {
            mechanism: 'PIPES' as any,
            bufferSize: 64 * 1024, // 64KB
            timeout: 5000, // 5 seconds
            compression: true
          },
          networking: {
            bindAddress: '127.0.0.1',
            port: 0, // Random port
            ssl: {
              enabled: false,
              certificatePath: '',
              privateKeyPath: '',
              cipherSuites: []
            },
            compression: true
          },
          serialization: {
            format: 'MSGPACK' as any,
            compression: true,
            encryption: false
          }
        }
      };

      expect(desktopObserver.processes.enabled).toBe(true);
      expect(desktopObserver.performance.parallelization.enabled).toBe(true);
      expect(desktopObserver.systemIntegration.fileWatching.enabled).toBe(true);
      expect(desktopObserver.communication.ipc.mechanism).toBe('PIPES');
    });
  });

  describe('Error Types', () => {
    it('should create valid web error', () => {
      const webError: WebError = {
        name: 'QuotaExceededError',
        message: 'Storage quota exceeded',
        type: WebErrorType.QUOTA_EXCEEDED,
        context: {
          browser: {
            name: 'Chrome',
            version: '120.0.0.0',
            engine: 'Blink',
            platform: 'MacOS',
            mobile: false
          },
          storage: {
            available: 0,
            used: 10 * 1024 * 1024, // 10MB
            quota: 10 * 1024 * 1024, // 10MB
            persistent: false
          },
          network: {
            online: true,
            effectiveType: '4g',
            downlink: 10.0,
            rtt: 100
          },
          permissions: [
            {
              name: 'persistent-storage',
              state: 'DENIED' as any
            }
          ]
        },
        recovery: {
          type: 'GRACEFUL_DEGRADATION' as any,
          actions: [
            {
              description: 'Clear cache to free up space',
              action: async () => { /* implementation */ },
              priority: 1,
              userVisible: true
            }
          ],
          fallback: {
            disableFeatures: ['offline-storage', 'large-file-support'],
            alternativeImplementation: 'memory-only-storage',
            userNotification: 'Storage quota exceeded. Some features disabled.'
          }
        }
      };

      expect(webError.type).toBe(WebErrorType.QUOTA_EXCEEDED);
      expect(webError.context.browser.name).toBe('Chrome');
      expect(webError.recovery.type).toBe('GRACEFUL_DEGRADATION');
    });

    it('should create valid desktop error', () => {
      const desktopError: DesktopError = {
        name: 'PermissionError',
        message: 'Access denied to system resource',
        type: DesktopErrorType.PERMISSION_ERROR,
        context: {
          system: {
            platform: 'darwin',
            arch: 'x64',
            version: '23.1.0',
            hostname: 'MacBook-Pro.local',
            uptime: 86400 // 1 day
          },
          process: {
            pid: 12345,
            ppid: 1,
            memory: {
              rss: 100 * 1024 * 1024, // 100MB
              heapTotal: 50 * 1024 * 1024, // 50MB
              heapUsed: 30 * 1024 * 1024, // 30MB
              external: 5 * 1024 * 1024 // 5MB
            },
            cpu: {
              user: 1000000, // 1 second
              system: 500000 // 0.5 seconds
            }
          },
          resources: {
            memory: {
              total: 16 * 1024 * 1024 * 1024, // 16GB
              free: 8 * 1024 * 1024 * 1024, // 8GB
              available: 10 * 1024 * 1024 * 1024, // 10GB
              used: 6 * 1024 * 1024 * 1024 // 6GB
            },
            disk: [
              {
                filesystem: '/dev/disk1s1',
                size: 1024 * 1024 * 1024 * 1024, // 1TB
                used: 500 * 1024 * 1024 * 1024, // 500GB
                available: 524 * 1024 * 1024 * 1024, // 524GB
                mountpoint: '/'
              }
            ],
            network: [
              {
                name: 'en0',
                address: '192.168.1.100',
                netmask: '255.255.255.0',
                family: 'IPv4',
                mac: '00:11:22:33:44:55',
                internal: false
              }
            ]
          },
          permissions: [
            {
              resource: '/usr/local/bin',
              permission: 'execute',
              granted: false,
              reason: 'Insufficient privileges'
            }
          ]
        },
        recovery: {
          type: 'ELEVATED_PERMISSIONS' as any,
          actions: [
            {
              description: 'Request administrator privileges',
              action: async () => { /* implementation */ },
              requiresElevation: true,
              systemImpact: 'MEDIUM' as any
            }
          ],
          fallback: {
            alternativeImplementation: 'user-space-only',
            reducedFunctionality: ['system-commands', 'global-file-access'],
            userGuidance: 'Some features require administrator privileges',
            supportContact: 'support@sherlock-omega.dev'
          }
        }
      };

      expect(desktopError.type).toBe(DesktopErrorType.PERMISSION_ERROR);
      expect(desktopError.context.system.platform).toBe('darwin');
      expect(desktopError.recovery.type).toBe('ELEVATED_PERMISSIONS');
    });
  });

  describe('Type Compatibility', () => {
    it('should ensure platform types are compatible with unified types', () => {
      // Test that platform-specific types can be used in unified contexts
      const webPlatform: PlatformType = PlatformType.WEB;
      const desktopPlatform: PlatformType = PlatformType.DESKTOP;

      expect(typeof webPlatform).toBe('string');
      expect(typeof desktopPlatform).toBe('string');
      expect(webPlatform).not.toBe(desktopPlatform);
    });

    it('should validate enum exhaustiveness', () => {
      // Ensure all enum values are properly defined
      const fileOperations = Object.values(FileOperation);
      expect(fileOperations).toContain('READ');
      expect(fileOperations).toContain('WRITE');
      expect(fileOperations).toContain('DELETE');
      expect(fileOperations).toContain('EXECUTE');

      const storageTypes = Object.values(StorageType);
      expect(storageTypes).toContain('LOCAL_STORAGE');
      expect(storageTypes).toContain('FILE_SYSTEM');
      expect(storageTypes).toContain('DATABASE');

      const uiFrameworks = Object.values(UIFramework);
      expect(uiFrameworks).toContain('REACT');
      expect(uiFrameworks).toContain('ELECTRON');
      expect(uiFrameworks).toContain('NATIVE');
    });
  });
});