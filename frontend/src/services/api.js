import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = {
  // キャラクター関連
  getCharacters: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/characters`);
    return response.data;
  },

  getCharacter: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/api/characters/${id}`);
    return response.data;
  },

  createCharacter: async (formData) => {
    const response = await axios.post(`${API_BASE_URL}/api/characters`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateCharacter: async (id, data) => {
    const response = await axios.put(`${API_BASE_URL}/api/characters/${id}`, data);
    return response.data;
  },

  updateCharacterImage: async (id, formData) => {
    const response = await axios.post(`${API_BASE_URL}/api/characters/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteCharacter: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/api/characters/${id}`);
    return response.data;
  },

  // ジャーナル関連
  getJournals: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/journals`);
    return response.data;
  },

  getJournal: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/api/journals/${id}`);
    return response.data;
  },

  createJournal: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/journals`, data);
    return response.data;
  },

  generateJournals: async (characterIds, theme) => {
    const response = await axios.post(`${API_BASE_URL}/api/journals/generate`, {
      character_ids: characterIds,
      theme: theme
    });
    return response.data;
  },

  updateJournal: async (id, data) => {
    const response = await axios.put(`${API_BASE_URL}/api/journals/${id}`, data);
    return response.data;
  },

  deleteJournal: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/api/journals/${id}`);
    return response.data;
  },

  // コメント関連
  getJournalComments: async (journalId) => {
    const response = await axios.get(`${API_BASE_URL}/api/comments/journal/${journalId}`);
    return response.data;
  },

  getCharacterComments: async (characterId) => {
    const response = await axios.get(`${API_BASE_URL}/api/comments/character/${characterId}`);
    return response.data;
  },

  getComment: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/api/comments/${id}`);
    return response.data;
  },

  createComment: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/api/comments`, data);
    return response.data;
  },

  generateComment: async (journalId, characterId, parentCommentId = null) => {
    const response = await axios.post(`${API_BASE_URL}/api/comments/generate`, {
      journal_id: journalId,
      character_id: characterId,
      parent_comment_id: parentCommentId
    });
    return response.data;
  },

  updateComment: async (id, data) => {
    const response = await axios.put(`${API_BASE_URL}/api/comments/${id}`, data);
    return response.data;
  },

  deleteComment: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/api/comments/${id}`);
    return response.data;
  },

  // Friends Discovery
  generateFriends: async (characterId, relationshipPhrase) => {
    const response = await axios.post(`${API_BASE_URL}/api/discovery/friends`, {
      character_id: characterId,
      relationship_phrase: relationshipPhrase
    });
    return response.data;
  }
};

export default api;