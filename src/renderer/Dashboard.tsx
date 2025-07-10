import React, { useState } from 'react';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f9fafb',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#e5e7eb',
    padding: '1rem',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    gap: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
    transition: 'background 0.2s ease-in-out',
  },
  navItemHover: {
    ':hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  active: {
    backgroundColor: '#f3f4f6',
  },
  icon: {
    width: '1rem',
    height: '1rem',
  },
  main: {
    flexGrow: 1,
    padding: '2rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '0.5rem',
    width: '300px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    marginBottom: '1rem',
    borderWidth: '1px',
    borderColor: '#00000',
    borderStyle: 'solid',
    borderRadius: '0.375rem',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#000000',
    color: 'white',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
});

const Dashboard = () => {
  const [subjects, setSubjects] = useState([{ name: 'New Subject' }]);

  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const handleAddSubject = () => {
    if (newSubject.trim()) {
      const updatedSubjects = [...subjects];
      updatedSubjects.splice(subjects.length - 1, 0, { name: newSubject });
      setSubjects(updatedSubjects);
      setNewSubject('');
      setShowModal(false);
    }
  };

  const handleClick = (subjectName: string) => {
    if (subjectName === 'New Subject') {
      setShowModal(true);
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <aside {...stylex.props(styles.sidebar)}>
        <p {...stylex.props(styles.title)}>Subjects</p>
        {subjects.map((subject) => (
          <div
            key={subject.name}
            onClick={() => handleClick(subject.name)}
            {...stylex.props(styles.navItem, styles.navItemHover)}
          >
            {subject.name}
          </div>
        ))}
      </aside>

      <main {...stylex.props(styles.main)}>
        <h1>Subject</h1>
        <p>Lorem ipsum dolor sit amet...</p>
      </main>

      {showModal && (
        <div {...stylex.props(styles.modalOverlay)}>
          <div {...stylex.props(styles.modalContent)}>
            <h3>Add New Subject</h3>
            <input
              type="text"
              placeholder="Enter subject name"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              {...stylex.props(styles.input)}
            />
            <button onClick={handleAddSubject} {...stylex.props(styles.button)}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
