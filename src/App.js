// Asegúrate de instalar las siguientes dependencias:
// npm install react react-dom react-spring react-dnd react-dnd-html5-backend xlsx

import React, { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag, useDrop } from 'react-dnd';
import { FaCheck, FaTrash, FaEdit, FaCalendar, FaFileExport } from 'react-icons/fa';
import { format, addDays } from 'date-fns';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver'; // Agrega esta línea
import './App.css';

// Resto del código...


const Task = ({ task, index, moveTask, deleteTask, toggleTask, editTask, setTaskDate }) => {
  const [, ref] = useDrag({
    type: 'TASK',
    item: { index },
  });

  const [, drop] = useDrop({
    accept: 'TASK',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveTask(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(task.text);
  const [editedDate, setEditedDate] = useState(task.date ? format(task.date, 'yyyy-MM-dd') : '');

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    editTask(task.id, editedText);
    setTaskDate(task.id, editedDate !== '' ? new Date(editedDate) : null);
    setIsEditing(false);
  };

  const handleDateChange = (event) => {
    setEditedDate(event.target.value);
  };

  return (
    <div ref={(node) => ref(drop(node))}>
      <li className={task.completed ? 'completed' : ''}>
        {!isEditing ? (
          <>
            <span>{task.text}</span>
            {task.date && (
              <span className="date">{format(task.date, 'dd/MM/yyyy')}</span>
            )}
            <div>
              <button onClick={() => toggleTask(task.id)}><FaCheck /></button>
              <button onClick={() => deleteTask(task.id)}><FaTrash /></button>
              <button onClick={handleEditClick}><FaEdit /></button>
              <button onClick={() => setTaskDate(task.id, addDays(new Date(), 1))}><FaCalendar /></button>
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />
            <input
              type="date"
              value={editedDate}
              onChange={handleDateChange}
            />
            <button onClick={handleSaveClick}>Guardar</button>
          </>
        )}
      </li>
    </div>
  );
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(storedTasks);
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() !== '') {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const moveTask = (fromIndex, toIndex) => {
    const updatedTasks = [...tasks];
    const [removedTask] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, removedTask);
    setTasks(updatedTasks);
  };

  const editTask = (taskId, newText) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, text: newText } : task
    ));
  };

  const setTaskDate = (taskId, newDate) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, date: newDate } : task
    ));
  };

  const closeCompletedTasks = () => {
    setTasks(prevTasks => prevTasks.filter(task => !task.completed));
  };

  const filterTasks = (task) => {
    switch (filter) {
      case 'completed':
        return task.completed;
      case 'pending':
        return !task.completed;
      default:
        return true;
    }
  };

  const exportTasks = () => {
    const tasksToExport = tasks.map(({ id, text, completed, date }) => ({ id, text, completed, date }));
    const worksheet = XLSX.utils.json_to_sheet(tasksToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tareas');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.xlsx';
    a.click();
  };

  const animatedProps = useSpring({
    opacity: 1,
    from: { opacity: 0 },
  });

  return (
    <animated.div className="App" style={animatedProps}>
      <h1>Lista de Tareas</h1>
      
      <div>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Agregar nueva tarea"
        />
        <button onClick={addTask}>Agregar</button>
      </div>
      <div>
        <label>Filtrar por:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="completed">Completadas</option>
          <option value="pending">Pendientes</option>
        </select>
        <button onClick={closeCompletedTasks}>Cerrar Tareas Completadas</button>
        <button onClick={exportTasks}><FaFileExport /> Exportar Tareas (Excel)</button>
      </div>
      <ul>
        {tasks.filter(filterTasks).map((task, index) => (
          <Task
            key={task.id}
            task={task}
            index={index}
            moveTask={moveTask}
            deleteTask={deleteTask}
            toggleTask={toggleTask}
            editTask={editTask}
            setTaskDate={setTaskDate}
          />
        ))}
      </ul>
      <p>Tareas Pendientes: {tasks.filter(task => !task.completed).length}</p>
    </animated.div>
  );
}

export default App;
