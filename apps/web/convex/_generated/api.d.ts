/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as adminUsers from "../adminUsers.js";
import type * as agent from "../agent.js";
import type * as agentActions from "../agentActions.js";
import type * as aiClarification from "../aiClarification.js";
import type * as aiEnhancement from "../aiEnhancement.js";
import type * as aiLogging from "../aiLogging.js";
import type * as aiMultiProvider from "../aiMultiProvider.js";
import type * as aiOperations from "../aiOperations.js";
import type * as aiProviderMonitoring from "../aiProviderMonitoring.js";
import type * as aiService from "../aiService.js";
import type * as analysis from "../analysis.js";
import type * as auth from "../auth.js";
import type * as cleanupLoggingTables from "../cleanupLoggingTables.js";
import type * as cleanupUsers from "../cleanupUsers.js";
import type * as clearAll from "../clearAll.js";
import type * as companies_getCompany from "../companies/getCompany.js";
import type * as companies_updateCompany from "../companies/updateCompany.js";
import type * as companies from "../companies.js";
import type * as createTestUsers from "../createTestUsers.js";
import type * as debug_checkUser from "../debug/checkUser.js";
import type * as debugActions from "../debugActions.js";
import type * as debugLogs from "../debugLogs.js";
import type * as email from "../email.js";
import type * as impersonation from "../impersonation.js";
import type * as incidents_createSampleData from "../incidents/createSampleData.js";
import type * as incidents from "../incidents.js";
import type * as internalLogging from "../internalLogging.js";
import type * as knowledge from "../knowledge.js";
import type * as knowledgeActions from "../knowledgeActions.js";
import type * as knowledgeMutations from "../knowledgeMutations.js";
import type * as lib_ai_questionGenerator from "../lib/ai/questionGenerator.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_config from "../lib/config.js";
import type * as lib_prompts_default_prompts from "../lib/prompts/default_prompts.js";
import type * as lib_prompts_prompt_resolver from "../lib/prompts/prompt_resolver.js";
import type * as lib_redisLogFetcher from "../lib/redisLogFetcher.js";
import type * as lib_sessionResolver from "../lib/sessionResolver.js";
import type * as lib_textProcessing from "../lib/textProcessing.js";
import type * as lib_userProtection from "../lib/userProtection.js";
import type * as lib_vectorize from "../lib/vectorize.js";
import type * as llmTest from "../llmTest.js";
import type * as logStreamsWebhook from "../logStreamsWebhook.js";
import type * as loggingAction from "../loggingAction.js";
import type * as migrations_cleanupCompanySlug from "../migrations/cleanupCompanySlug.js";
import type * as migrations from "../migrations.js";
import type * as monitoring from "../monitoring.js";
import type * as narratives from "../narratives.js";
import type * as participants_create from "../participants/create.js";
import type * as participants_createSampleData from "../participants/createSampleData.js";
import type * as participants_getById from "../participants/getById.js";
import type * as participants_list from "../participants/list.js";
import type * as participants_search from "../participants/search.js";
import type * as participants_update from "../participants/update.js";
import type * as participants_updateStatus from "../participants/updateStatus.js";
import type * as permissions from "../permissions.js";
import type * as promptManager from "../promptManager.js";
import type * as promptUsageLogs from "../promptUsageLogs.js";
import type * as prompts from "../prompts.js";
import type * as queries from "../queries.js";
import type * as seed from "../seed.js";
import type * as seedAiPrompts from "../seedAiPrompts.js";
import type * as seedTestCompanies from "../seedTestCompanies.js";
import type * as seedTestUsers from "../seedTestUsers.js";
import type * as sessionManagement from "../sessionManagement.js";
import type * as simpleCleanup from "../simpleCleanup.js";
import type * as testingHelpers from "../testingHelpers.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";
import type * as workerSync from "../workerSync.js";
import type * as workflowData from "../workflowData.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminUsers: typeof adminUsers;
  agent: typeof agent;
  agentActions: typeof agentActions;
  aiClarification: typeof aiClarification;
  aiEnhancement: typeof aiEnhancement;
  aiLogging: typeof aiLogging;
  aiMultiProvider: typeof aiMultiProvider;
  aiOperations: typeof aiOperations;
  aiProviderMonitoring: typeof aiProviderMonitoring;
  aiService: typeof aiService;
  analysis: typeof analysis;
  auth: typeof auth;
  cleanupLoggingTables: typeof cleanupLoggingTables;
  cleanupUsers: typeof cleanupUsers;
  clearAll: typeof clearAll;
  "companies/getCompany": typeof companies_getCompany;
  "companies/updateCompany": typeof companies_updateCompany;
  companies: typeof companies;
  createTestUsers: typeof createTestUsers;
  "debug/checkUser": typeof debug_checkUser;
  debugActions: typeof debugActions;
  debugLogs: typeof debugLogs;
  email: typeof email;
  impersonation: typeof impersonation;
  "incidents/createSampleData": typeof incidents_createSampleData;
  incidents: typeof incidents;
  internalLogging: typeof internalLogging;
  knowledge: typeof knowledge;
  knowledgeActions: typeof knowledgeActions;
  knowledgeMutations: typeof knowledgeMutations;
  "lib/ai/questionGenerator": typeof lib_ai_questionGenerator;
  "lib/auth": typeof lib_auth;
  "lib/config": typeof lib_config;
  "lib/prompts/default_prompts": typeof lib_prompts_default_prompts;
  "lib/prompts/prompt_resolver": typeof lib_prompts_prompt_resolver;
  "lib/redisLogFetcher": typeof lib_redisLogFetcher;
  "lib/sessionResolver": typeof lib_sessionResolver;
  "lib/textProcessing": typeof lib_textProcessing;
  "lib/userProtection": typeof lib_userProtection;
  "lib/vectorize": typeof lib_vectorize;
  llmTest: typeof llmTest;
  logStreamsWebhook: typeof logStreamsWebhook;
  loggingAction: typeof loggingAction;
  "migrations/cleanupCompanySlug": typeof migrations_cleanupCompanySlug;
  migrations: typeof migrations;
  monitoring: typeof monitoring;
  narratives: typeof narratives;
  "participants/create": typeof participants_create;
  "participants/createSampleData": typeof participants_createSampleData;
  "participants/getById": typeof participants_getById;
  "participants/list": typeof participants_list;
  "participants/search": typeof participants_search;
  "participants/update": typeof participants_update;
  "participants/updateStatus": typeof participants_updateStatus;
  permissions: typeof permissions;
  promptManager: typeof promptManager;
  promptUsageLogs: typeof promptUsageLogs;
  prompts: typeof prompts;
  queries: typeof queries;
  seed: typeof seed;
  seedAiPrompts: typeof seedAiPrompts;
  seedTestCompanies: typeof seedTestCompanies;
  seedTestUsers: typeof seedTestUsers;
  sessionManagement: typeof sessionManagement;
  simpleCleanup: typeof simpleCleanup;
  testingHelpers: typeof testingHelpers;
  users: typeof users;
  validation: typeof validation;
  workerSync: typeof workerSync;
  workflowData: typeof workflowData;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
