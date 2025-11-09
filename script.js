// Global Variables
let pieChart, barChart, trendChart, categoryChart;
let budgetHistory = JSON.parse(localStorage.getItem('budgetHistory')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Initialize on page load
window.onload = function() {
  initializeCategories();
  loadHistory();
  loadAnalytics();
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
};

// Initialize default categories
function initializeCategories() {
  addCategory('fixed', 'Rent', '');
  addCategory('fixed', 'Health Insurance', '');
  addCategory('variable', 'Groceries', '');
  addCategory('variable', 'Entertainment', '');
  addCategory('savings', 'Emergency Fund', '');
  addCategory('savings', 'Investments', '');
}

// Tab Navigation
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + '-tab').classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Load specific tab data
  if (tabName === 'history') {
    loadHistory();
  } else if (tabName === 'analytics') {
    loadAnalytics();
  }
}

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  
  const themeBtn = document.querySelector('.theme-toggle');
  themeBtn.textContent = isDarkMode ? '☀️' : '🌙';
  
  showToast(isDarkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

// Add Category Item
function addCategory(type, defaultName = '', defaultAmount = '') {
  const container = document.getElementById(type + '-container');
  const item = document.createElement('div');
  item.className = 'category-item';
  
  item.innerHTML = `
    <input type="text" placeholder="Name" class="${type}-name" value="${defaultName}">
    <input type="number" placeholder="₹ Amount" class="${type}-amount" value="${defaultAmount}">
    <button class="remove-btn" onclick="removeCategory(this)">×</button>
  `;
  
  container.appendChild(item);
  
  // Add input listeners for real-time update
  item.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateQuickStats);
  });
}

// Remove Category Item
function removeCategory(btn) {
  btn.parentElement.remove();
  updateQuickStats();
}

// Update Quick Stats in real-time
function updateQuickStats() {
  const income = Number(document.getElementById('income').value) || 0;
  
  const fixedAmounts = [...document.querySelectorAll('.fixed-amount')].map(i => Number(i.value) || 0);
  const variableAmounts = [...document.querySelectorAll('.variable-amount')].map(i => Number(i.value) || 0);
  const savingAmounts = [...document.querySelectorAll('.savings-amount')].map(i => Number(i.value) || 0);
  
  const totalExpenses = fixedAmounts.reduce((a,b) => a+b, 0) + variableAmounts.reduce((a,b) => a+b, 0);
  const totalSavings = savingAmounts.reduce((a,b) => a+b, 0);
  const balance = income - totalExpenses - totalSavings;
  
  document.getElementById('quickExpense').textContent = '₹' + totalExpenses.toLocaleString('en-IN');
  document.getElementById('quickSaving').textContent = '₹' + totalSavings.toLocaleString('en-IN');
  document.getElementById('quickBalance').textContent = '₹' + balance.toLocaleString('en-IN');
  
  // Color coding
  const balanceEl = document.getElementById('quickBalance');
  balanceEl.style.color = balance >= 0 ? '#10b981' : '#ef4444';
}

// Calculate Budget
function calculateBudget() {
  const income = Number(document.getElementById('income').value) || 0;
  
  if (income === 0) {
    showToast('⚠️ Please enter your monthly income!');
    return;
  }
  
  // Get all amounts
  const fixedAmounts = [...document.querySelectorAll('.fixed-amount')].map(i => Number(i.value) || 0);
  const variableAmounts = [...document.querySelectorAll('.variable-amount')].map(i => Number(i.value) || 0);
  const savingAmounts = [...document.querySelectorAll('.savings-amount')].map(i => Number(i.value) || 0);
  
  const totalExpenses = fixedAmounts.reduce((a,b) => a+b, 0) + variableAmounts.reduce((a,b) => a+b, 0);
  const totalSavings = savingAmounts.reduce((a,b) => a+b, 0);
  const balance = income - totalExpenses - totalSavings;
  
  // Update Summary Card
  document.getElementById('summaryIncome').textContent = '₹' + income.toLocaleString('en-IN');
  document.getElementById('summaryExpense').textContent = '₹' + totalExpenses.toLocaleString('en-IN');
  document.getElementById('summarySaving').textContent = '₹' + totalSavings.toLocaleString('en-IN');
  document.getElementById('summaryBalance').textContent = '₹' + balance.toLocaleString('en-IN');
  
  // Update balance color
  const balanceEl = document.getElementById('summaryBalance');
  balanceEl.style.color = balance >= 0 ? '#10b981' : '#ef4444';
  
  // Show summary card
  document.getElementById('summaryCard').style.display = 'block';
  
  // Update progress bars
  const expensePercent = (totalExpenses / income) * 100;
  const savingPercent = (totalSavings / income) * 100;
  
  document.getElementById('expenseBar').style.width = Math.min(expensePercent, 100) + '%';
  document.getElementById('savingBar').style.width = Math.min(savingPercent, 100) + '%';
  
  // Health Badge
  updateHealthBadge(savingPercent, expensePercent, balance);
  
  // AI Insights
  generateInsights(income, totalExpenses, totalSavings, balance, savingPercent, expensePercent);
  
  // Update Charts
  updateCharts(totalExpenses, totalSavings, Math.max(0, balance), income);
  
  // Save to history
  saveBudgetToHistory(income, totalExpenses, totalSavings, balance);
  
  // Success message
  showToast('✅ Budget calculated successfully!');
  
  // Smooth scroll to results
  document.getElementById('summaryCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Update Health Badge
function updateHealthBadge(savingPercent, expensePercent, balance) {
  const badge = document.getElementById('healthBadge');
  
  if (savingPercent >= 20 && balance >= 0) {
    badge.className = 'health-badge badge-excellent';
    badge.innerHTML = '🎉 Excellent! You\'re on track!';
  } else if (savingPercent >= 10 && balance >= 0) {
    badge.className = 'health-badge badge-good';
    badge.innerHTML = '👍 Good! Keep improving!';
  } else {
    badge.className = 'health-badge badge-warning';
    badge.innerHTML = '⚠️ Warning! Review your budget!';
  }
}

// Generate AI Insights
function generateInsights(income, expenses, savings, balance, savingPercent, expensePercent) {
  const insights = [];
  
  // Savings insights
  if (savingPercent < 10) {
    insights.push('💡 Try to save at least 10% of your income. Currently saving only ' + savingPercent.toFixed(1) + '%');
  } else if (savingPercent >= 20) {
    insights.push('🌟 Excellent! You\'re saving ' + savingPercent.toFixed(1) + '% of your income!');
  }
  
  // Expense insights
  if (expensePercent > 70) {
    insights.push('🚨 Your expenses are ' + expensePercent.toFixed(1) + '% of income. Try to reduce non-essential spending.');
  } else if (expensePercent < 50) {
    insights.push('💰 Great job! Your expenses are only ' + expensePercent.toFixed(1) + '% of income.');
  }
  
  // Balance insights
  if (balance < 0) {
    insights.push('⚠️ You\'re spending ₹' + Math.abs(balance).toLocaleString('en-IN') + ' more than you earn. Time to cut expenses!');
  } else if (balance > income * 0.3) {
    insights.push('🎯 You have ₹' + balance.toLocaleString('en-IN') + ' left. Consider increasing your savings!');
  }
  
  // 50-30-20 rule
  const needsPercent = 50;
  const wantsPercent = 30;
  const savingsIdeal = 20;
  
  insights.push('📊 Ideal budget: 50% needs, 30% wants, 20% savings. Your savings: ' + savingPercent.toFixed(1) + '%');
  
  // Emergency fund
  const emergencyFund = savings * 6;
  insights.push('🛡️ Build an emergency fund worth ₹' + emergencyFund.toLocaleString('en-IN') + ' (6 months of savings)');
  
  // Display insights
  const insightsContent = document.getElementById('insightsContent');
  insightsContent.innerHTML = insights.map(insight => 
    `<div class="insight-item">${insight}</div>`
  ).join('');
  
  document.getElementById('insightsCard').style.display = 'block';
}

// Update Charts
function updateCharts(expenses, savings, balance, income) {
  // Pie Chart
  const ctx1 = document.getElementById('pieChart');
  if (pieChart) pieChart.destroy();
  
  pieChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Expenses', 'Savings', 'Balance'],
      datasets: [{
        data: [expenses, savings, balance],
        backgroundColor: ['#ef4444', '#10b981', '#6366f1'],
        borderWidth: 0,
        hoverOffset: 20
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: { size: 13, family: 'Poppins', weight: '600' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percent = ((value / income) * 100).toFixed(1);
              return context.label + ': ₹' + value.toLocaleString('en-IN') + ' (' + percent + '%)';
            }
          }
        }
      }
    }
  });
  
  // Bar Chart
  const ctx2 = document.getElementById('barChart');
  if (barChart) barChart.destroy();
  
  barChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Expenses', 'Savings', 'Balance'],
      datasets: [{
        label: 'Amount (₹)',
        data: [expenses, savings, balance],
        backgroundColor: ['#ef4444', '#10b981', '#6366f1'],
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return '₹' + context.parsed.y.toLocaleString('en-IN');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            },
            font: { family: 'Poppins' }
          },
          grid: { color: '#f3f4f6' }
        },
        x: {
          ticks: { font: { family: 'Poppins', weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// Save Budget to History
function saveBudgetToHistory(income, expenses, savings, balance) {
  const budgetData = {
    date: new Date().toLocaleString('en-IN'),
    income: income,
    expenses: expenses,
    savings: savings,
    balance: balance
  };
  
  budgetHistory.unshift(budgetData);
  
  // Keep only last 10 entries
  if (budgetHistory.length > 10) {
    budgetHistory = budgetHistory.slice(0, 10);
  }
  
  localStorage.setItem('budgetHistory', JSON.stringify(budgetHistory));
}

// Load History
function loadHistory() {
  const historyList = document.getElementById('historyList');
  
  if (budgetHistory.length === 0) {
    historyList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No budget history yet. Calculate your first budget!</p>';
    return;
  }
  
  historyList.innerHTML = budgetHistory.map((item, index) => `
    <div class="history-item">
      <div class="history-date">${item.date}</div>
      <div class="history-details">
        <div class="history-detail">
          <div class="history-label">Income</div>
          <div class="history-value" style="color: #10b981;">₹${item.income.toLocaleString('en-IN')}</div>
        </div>
        <div class="history-detail">
          <div class="history-label">Expenses</div>
          <div class="history-value" style="color: #ef4444;">₹${item.expenses.toLocaleString('en-IN')}</div>
        </div>
        <div class="history-detail">
          <div class="history-label">Savings</div>
          <div class="history-value" style="color: #f59e0b;">₹${item.savings.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// Clear History
function clearHistory() {
  if (confirm('Are you sure you want to clear all budget history?')) {
    budgetHistory = [];
    localStorage.removeItem('budgetHistory');
    loadHistory();
    showToast('🗑️ History cleared successfully!');
  }
}

// Load Analytics
function loadAnalytics() {
  if (budgetHistory.length < 2) {
    return;
  }
  
  // Prepare data for trend chart
  const dates = budgetHistory.slice().reverse().map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  });
  
  const incomeData = budgetHistory.slice().reverse().map(item => item.income);
  const expenseData = budgetHistory.slice().reverse().map(item => item.expenses);
  const savingsData = budgetHistory.slice().reverse().map(item => item.savings);
  
  // Trend Chart
  const ctx3 = document.getElementById('trendChart');
  if (trendChart) trendChart.destroy();
  
  trendChart = new Chart(ctx3, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Savings',
          data: savingsData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Poppins', weight: '600' } }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          }
        }
      }
    }
  });
  
  // Category breakdown (using latest budget)
  const latest = budgetHistory[0];
  
  const ctx4 = document.getElementById('categoryChart');
  if (categoryChart) categoryChart.destroy();
  
  categoryChart = new Chart(ctx4, {
    type: 'polarArea',
    data: {
      labels: ['Expenses', 'Savings', 'Balance'],
      datasets: [{
        data: [latest.expenses, latest.savings, latest.balance],
        backgroundColor: ['#ef4444', '#10b981', '#6366f1']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Poppins', weight: '600' } }
        }
      }
    }
  });
}

// Show Toast Notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Add input listener to income field
document.addEventListener('DOMContentLoaded', function() {
  const incomeInput = document.getElementById('income');
  if (incomeInput) {
    incomeInput.addEventListener('input', updateQuickStats);
  }
});