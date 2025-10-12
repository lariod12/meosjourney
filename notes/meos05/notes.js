// ========================================
// Daily Update - UI Template (No Logic)
// ========================================

// Password Protection
const CORRECT_PASSWORD = 'meos05'; // Change this to your desired password
const SESSION_KEY = 'meos05_access';

function checkAccess() {
    // Check if already authenticated in this session
    if (sessionStorage.getItem(SESSION_KEY) === 'granted') {
        return true;
    }
    
    // Prompt for password
    const userPassword = prompt('🔒 Enter password to access:');
    
    if (userPassword === CORRECT_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'granted');
        return true;
    } else if (userPassword !== null) {
        alert('❌ Incorrect password. Access denied.');
    }
    
    // Redirect back if access denied
    window.location.href = '../../index.html';
    return false;
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Check access first
    if (!checkAccess()) {
        return;
    }
    
    // Auto-fill current date
    const dateInput = document.getElementById('noteDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Form submission placeholder
    const form = document.getElementById('dailyUpdateForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Just show form data in console for testing
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        console.log('=== FORM DATA (Test Only) ===');
        console.log(data);
        console.log('=============================');
        
        alert('✓ UI Test Mode\n\nForm data logged to console.\nLogic chưa được implement.');
    });

    // Form reset handler
    form.addEventListener('reset', function() {
        setTimeout(() => {
            dateInput.value = today;
        }, 0);
    });
});
