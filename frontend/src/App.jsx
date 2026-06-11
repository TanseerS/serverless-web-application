import { useEffect, useState } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getHealth } from './api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [health, setHealth] = useState('checking…');
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setTasks(await getTasks());
      setError('');
    } catch {
      setError('Could not reach the API. Is the backend running?');
    }
  }

  useEffect(() => {
    refresh();
    getHealth()
      .then((h) => setHealth(h.database === 'connected' ? 'API + DB connected' : 'DB unreachable'))
      .catch(() => setHealth('API unreachable'));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(title);
    setTitle('');
    refresh();
  }

  async function handleToggle(task) {
    await updateTask(task.id, { completed: !task.completed });
    refresh();
  }

  async function handleDelete(id) {
    await deleteTask(id);
    refresh();
  }

  return (
    <div className="container">
      <h1>Tasks</h1>
      <p className="health">{health}</p>

      <form onSubmit={handleAdd} className="add-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.completed ? 'done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task)}
              />
              <span>{task.title}</span>
            </label>
            <button onClick={() => handleDelete(task.id)} className="delete">
              ✕
            </button>
          </li>
        ))}
        {tasks.length === 0 && !error && <li className="empty">No tasks yet</li>}
      </ul>
    </div>
  );
}
