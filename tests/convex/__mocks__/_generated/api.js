/**
 * Mock for Convex generated API module
 */

module.exports = {
  api: {
    knowledge: {
      getDocumentByPath: 'knowledge/getDocumentByPath',
      getDocuments: 'knowledge/getDocuments',
      getDocumentChunks: 'knowledge/getDocumentChunks',
      getChunkByVectorizeId: 'knowledge/getChunkByVectorizeId',
    },
    knowledgeActions: {
      addDocument: 'knowledgeActions/addDocument',
      queryVectorSimilarity: 'knowledgeActions/queryVectorSimilarity',
    },
    knowledgeMutations: {
      createOrUpdateDocument: 'knowledgeMutations/createOrUpdateDocument',
      createDocumentChunk: 'knowledgeMutations/createDocumentChunk',
      updateDocumentStatus: 'knowledgeMutations/updateDocumentStatus',
      deleteDocument: 'knowledgeMutations/deleteDocument',
      getDocumentByPath: 'knowledgeMutations/getDocumentByPath',
    },
    users: {
      getUserById: 'users/getUserById',
      getCurrentUser: 'users/getCurrentUser',
      updateUserProfile: 'users/updateUserProfile',
      updateUserTheme: 'users/updateUserTheme',
    },
  },
  internal: {
    knowledgeMutations: {
      createOrUpdateDocument: 'internal/knowledgeMutations/createOrUpdateDocument',
      createDocumentChunk: 'internal/knowledgeMutations/createDocumentChunk',
      updateDocumentStatus: 'internal/knowledgeMutations/updateDocumentStatus',
      deleteChunksBySource: 'internal/knowledgeMutations/deleteChunksBySource',
    },
    chatMutations: {
      createChatSession: 'internal/chatMutations/createChatSession',
      addMessage: 'internal/chatMutations/addMessage',
      updateSessionTitle: 'internal/chatMutations/updateSessionTitle',
      deleteChatSession: 'internal/chatMutations/deleteChatSession',
    },
  },
};