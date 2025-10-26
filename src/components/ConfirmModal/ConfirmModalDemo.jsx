import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

const ConfirmModalDemo = () => {
  const [modal, setModal] = useState({ isOpen: false });

  const showModal = (type, title, message) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => {
        console.log(`✅ ${type} modal confirmed`);
        setModal({ isOpen: false });
      }
    });
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Kalam, cursive' }}>
      <h1>ConfirmModal Demo</h1>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button 
          onClick={() => showModal('success', 'Success', 'Status Update & Journal Entry saved successfully!')}
          style={{ padding: '0.5rem 1rem', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Success Modal
        </button>
        
        <button 
          onClick={() => showModal('warning', 'No Data', 'No data to save. Please fill in at least one field.')}
          style={{ padding: '0.5rem 1rem', background: '#FF9800', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Warning Modal
        </button>
        
        <button 
          onClick={() => showModal('error', 'Access Denied', 'Incorrect password. Please try again.')}
          style={{ padding: '0.5rem 1rem', background: '#F44336', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Error Modal
        </button>
        
        <button 
          onClick={() => showModal('info', 'Information', 'This is an informational message.')}
          style={{ padding: '0.5rem 1rem', background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Info Modal
        </button>
      </div>

      <ConfirmModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal({ isOpen: false })}
      />
    </div>
  );
};

export default ConfirmModalDemo;