// Reusable UI components and utilities

// Toast notification system
const Toast = {
  show: function(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
      success: 'fas fa-check-circle',
      error: 'fas fa-times-circle',  
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <i class="${icon} text-lg"></i>
        <div class="flex-1">
          <p class="font-medium">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
          <p class="text-sm text-muted-foreground">${message}</p>
        </div>
        <button class="text-muted-foreground hover:text-foreground" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    container.appendChild(toast);
    
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, duration);
    }
  }
};

// Modal system
const Modal = {
  show: function(title, content, actions = '') {
    const container = document.getElementById('modalContainer');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="p-6 border-b border-border">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">${title}</h2>
            <button class="text-muted-foreground hover:text-foreground" onclick="Modal.close()">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
        <div class="p-6">
          ${content}
        </div>
        ${actions ? `<div class="p-6 border-t border-border flex justify-end gap-3">${actions}</div>` : ''}
      </div>
    `;
    
    container.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        Modal.close();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', Modal.handleEscape);
  },
  
  close: function() {
    const container = document.getElementById('modalContainer');
    container.innerHTML = '';
    document.removeEventListener('keydown', Modal.handleEscape);
  },
  
  handleEscape: function(e) {
    if (e.key === 'Escape') {
      Modal.close();
    }
  }
};

// Confirm dialog
function confirmDialog(message, onConfirm) {
  const actions = `
    <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-destructive" onclick="Modal.close(); (${onConfirm})()">Confirm</button>
  `;
  Modal.show('Confirm Action', `<p>${message}</p>`, actions);
}

// Form helpers
const FormHelpers = {
  serializeForm: function(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  },
  
  validateForm: function(form) {
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('border-destructive');
        isValid = false;
      } else {
        input.classList.remove('border-destructive');
      }
    });
    
    return isValid;
  },
  
  resetForm: function(form) {
    form.reset();
    const inputs = form.querySelectorAll('.border-destructive');
    inputs.forEach(input => input.classList.remove('border-destructive'));
  }
};

// Table builder
function createTable(data, columns, actions = []) {
  if (!data || data.length === 0) {
    return '<div class="text-center py-8 text-muted-foreground">No data available</div>';
  }
  
  let html = `
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
            ${actions.length > 0 ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;
  
  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      let value = row[col.key];
      if (col.render) {
        value = col.render(value, row);
      }
      html += `<td>${value}</td>`;
    });
    
    if (actions.length > 0) {
      html += '<td><div class="flex gap-2">';
      actions.forEach(action => {
        html += `<button class="btn btn-outline btn-sm" onclick="${action.onclick}('${row.id}')">${action.label}</button>`;
      });
      html += '</div></td>';
    }
    
    html += '</tr>';
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}

// Status badge component
function createStatusBadge(status) {
  const statusClasses = {
    available: 'status-available',
    occupied: 'status-occupied',
    maintenance: 'status-maintenance',
    active: 'status-active',
    cancelled: 'status-cancelled',
    'checked-in': 'status-checked-in',
    'checked-out': 'status-checked-out'
  };
  
  const className = statusClasses[status] || 'bg-muted text-muted-foreground';
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${className}">${status}</span>`;
}

// Search functionality
function createSearchBox(placeholder, onSearch) {
  return `
    <div class="relative">
      <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
      <input 
        type="text" 
        placeholder="${placeholder}"
        class="form-input pl-10"
        oninput="${onSearch}(this.value)"
      >
    </div>
  `;
}

// Card component
function createCard(title, content, actions = '') {
  return `
    <div class="hotel-card">
      <div class="p-6">
        ${title ? `<h3 class="text-lg font-semibold mb-4">${title}</h3>` : ''}
        ${content}
        ${actions ? `<div class="mt-4 flex gap-3">${actions}</div>` : ''}
      </div>
    </div>
  `;
}

// Stat card component
function createStatCard(title, value, description, icon, trend = '') {
  return `
    <div class="hotel-card animate-fade-in">
      <div class="p-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-muted-foreground">${title}</p>
          <i class="${icon} text-accent text-xl"></i>
        </div>
        <div class="text-3xl font-bold text-foreground mb-1">${value}</div>
        <p class="text-xs text-muted-foreground">
          ${trend ? `<span class="text-success flex items-center gap-1"><i class="fas fa-trending-up"></i>${trend}</span>` : ''}
          ${description}
        </p>
      </div>
    </div>
  `;
}

// Date formatting
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Currency formatting
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}