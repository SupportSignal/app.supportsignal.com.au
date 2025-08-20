'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@starter/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { 
  Brain,
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  Database,
  CloudCog
} from 'lucide-react';

interface ModelTestResult {
  success: boolean;
  model: string;
  response: string;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  responseTime?: number; // Individual model response time
}

interface LLMTestResult {
  success: boolean;
  responseTime: number;
  testResults?: {
    primary: ModelTestResult;
    fallback: ModelTestResult;
    bothWorking: boolean;
  };
  // Legacy single model properties for backward compatibility
  modelUsed?: string;
  response?: string;
  error?: string;
  timestamp: Date;
  configuration?: LLMConfiguration | null;
  metadata?: any;
}

interface LLMConfiguration {
  currentModel: string;
  fallbackModel: string;
  source: 'environment' | 'database';
  environmentModel?: string;
  databaseModel?: string;
}

export function LLMTestInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<LLMTestResult | null>(null);
  const [configuration, setConfiguration] = useState<LLMConfiguration | null>(null);
  
  const testLLM = useAction(api.llmTest.testLLMCommunication);

  const testLLMCommunication = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const startTime = Date.now();
      
      // Call the actual Convex action to test LLM
      const result = await testLLM({});
      
      const endTime = Date.now();
      
      // Debug log to see what we're receiving
      console.log("LLM Test Result received:", result);
      
      // Transform the result to match our interface
      const testResult: LLMTestResult = {
        success: result.success,
        responseTime: result.responseTime,
        // Handle both new and legacy formats
        testResults: result.testResults,
        modelUsed: result.modelUsed,
        response: result.response,
        error: result.error,
        timestamp: new Date(),
        configuration: result.configuration,
        metadata: result.metadata,
      };
      
      setTestResult(testResult);
      if (result.configuration) {
        setConfiguration(result.configuration);
      }
      
    } catch (error) {
      const errorResult: LLMTestResult = {
        success: false,
        responseTime: 0,
        modelUsed: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      };
      
      setTestResult(errorResult);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'environment':
        return <CloudCog className="h-4 w-4 text-green-600" />;
      case 'database':
        return <Database className="h-4 w-4 text-blue-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          LLM Communication Test
        </CardTitle>
        <CardDescription>
          Test AI model connectivity and validate current configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Configuration Display */}
        {configuration && (
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Model:</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {configuration.currentModel}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Fallback Model:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {configuration.fallbackModel}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Configuration Source:</span>
              <div className="flex items-center gap-1">
                {getSourceIcon(configuration.source)}
                <Badge 
                  variant={configuration.source === 'environment' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {configuration.source}
                </Badge>
              </div>
            </div>

            {/* Source Comparison */}
            {configuration.environmentModel && configuration.databaseModel && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <CloudCog className="h-3 w-3" />
                      Environment:
                    </span>
                    <code className="font-mono">{configuration.environmentModel}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Database:
                    </span>
                    <code className="font-mono">{configuration.databaseModel}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Button */}
        <Button
          onClick={testLLMCommunication}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Testing Communication...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Test LLM Communication
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResult.success)}
                <span className="font-medium">
                  {testResult.success ? 'Communication Successful' : 'Communication Failed'}
                </span>
              </div>
              <Badge variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? 'SUCCESS' : 'FAILED'}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Response Time:
              </span>
              <span className="font-mono">{testResult.responseTime.toFixed(2)}s</span>
            </div>

            {/* Dual Model Test Results */}
            {testResult.testResults && (
              <div className="space-y-3">
                {/* Primary Model Results */}
                <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Primary Model
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResult.testResults.primary.success)}
                      <Badge 
                        variant={testResult.testResults.primary.success ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {testResult.testResults.primary.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {testResult.testResults.primary.model}
                      </Badge>
                    </div>
                    
                    {testResult.testResults.primary.responseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Response Time:
                        </span>
                        <span className="font-mono text-xs">{testResult.testResults.primary.responseTime.toFixed(2)}s</span>
                      </div>
                    )}
                    
                    {testResult.testResults.primary.success && testResult.testResults.primary.response && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Response:</span>
                        <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs italic">
                          "{testResult.testResults.primary.response.substring(0, 80)}{testResult.testResults.primary.response.length > 80 ? '...' : ''}"
                        </div>
                      </div>
                    )}
                    
                    {!testResult.testResults.primary.success && testResult.testResults.primary.error && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Error:</span>
                        <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200 text-xs">
                          {testResult.testResults.primary.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fallback Model Results */}
                <div className="border rounded-lg p-3 bg-orange-50 dark:bg-orange-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Fallback Model
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResult.testResults.fallback.success)}
                      <Badge 
                        variant={testResult.testResults.fallback.success ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {testResult.testResults.fallback.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {testResult.testResults.fallback.model}
                      </Badge>
                    </div>
                    
                    {testResult.testResults.fallback.responseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Response Time:
                        </span>
                        <span className="font-mono text-xs">{testResult.testResults.fallback.responseTime.toFixed(2)}s</span>
                      </div>
                    )}
                    
                    {testResult.testResults.fallback.success && testResult.testResults.fallback.response && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Response:</span>
                        <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs italic">
                          "{testResult.testResults.fallback.response.substring(0, 80)}{testResult.testResults.fallback.response.length > 80 ? '...' : ''}"
                        </div>
                      </div>
                    )}
                    
                    {!testResult.testResults.fallback.success && testResult.testResults.fallback.error && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Error:</span>
                        <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200 text-xs">
                          {testResult.testResults.fallback.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Badge */}
                {testResult.testResults.bothWorking && (
                  <div className="text-center">
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      ✅ Both Primary and Fallback Models Working
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Legacy Single Model Results (fallback for backward compatibility) */}
            {!testResult.testResults && testResult.success && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Model Used:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {testResult.modelUsed}
                  </Badge>
                </div>

                {testResult.response && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Response:</span>
                    <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-800 dark:text-blue-200 italic">
                      "{testResult.response.substring(0, 100)}{testResult.response.length > 100 ? '...' : ''}"
                    </div>
                  </div>
                )}
              </>
            )}

            {!testResult.success && testResult.error && (
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Error:</span>
                  <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200">
                    {testResult.error}
                  </div>
                </div>

                {/* Show metadata if available */}
                {testResult.metadata && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Debug Info:</span>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                      <pre>{JSON.stringify(testResult.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Common troubleshooting suggestions */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="font-medium">💡 Troubleshooting suggestions:</div>
                  <div>• Verify OPENROUTER_API_KEY is configured in environment</div>
                  <div>• Check if the model is available on OpenRouter</div>
                  <div>• Run <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">scripts/sync-env.js</code> to sync environment variables</div>
                  <div>• Ensure Convex deployment has latest environment variables</div>
                  <div>• Check network connectivity to OpenRouter API</div>
                  <div>• Try using fallback model ({configuration?.fallbackModel})</div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Tested at {testResult.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 This test validates your AI model configuration and connectivity with real API calls.</div>
          <div>✅ Uses the same configuration chain and fallback logic as production AI services.</div>
          <div>🔧 Shows current environment configuration vs database model selection.</div>
          <div>⚡ Tests both primary model ({configuration?.currentModel || 'loading...'}) and fallback model if needed.</div>
        </div>
      </CardContent>
    </Card>
  );
}