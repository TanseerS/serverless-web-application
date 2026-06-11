const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getHealth = () => request('/api/health');
export const getTasks = () => request('/api/tasks');
export const createTask = (title) =>
  request('/api/tasks', { method: 'POST', body: JSON.stringify({ title }) });
export const updateTask = (id, data) =>
  request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id) =>
  request(`/api/tasks/${id}`, { method: 'DELETE' });
