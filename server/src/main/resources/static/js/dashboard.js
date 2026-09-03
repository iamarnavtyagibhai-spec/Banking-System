/* ==========================================================================
   NOVA BANK - DASHBOARD & TRANSACTIONS CONTROLLER
   ========================================================================== */

let currentAccountData = null;
let allTransactions = [];
let isBalanceHidden = false;
let currentTxFilter = 'ALL';

/**
 * Initialize Dashboard View
 */
async function loadDashboard() {
  const user = API_CONFIG.getUser();
  const email = user.email || 'user@novabank.com';
  
  const userEmailDisplay = document.getElementById('user-email-display');
  if (userEmailDisplay) userEmailDisplay.innerText = email;

  const cardHolder = document.getElementById('card-holder-name');
  if (cardHolder) cardHolder.innerText = email.split('@')[0];

  const avatarInitial = document.getElementById('user-avatar-initial');
  if (avatarInitial) avatarInitial.innerText = (email[0] || 'U').toUpperCase();

  try {
    await Promise.all([
      refreshAccountDetails(),
      refreshTransactionHistory()
    ]);
  } catch (error) {
    showToast('Failed to load dashboard data. ' + error.message, 'error');
  }
}

/**
 * Refresh Account Balance & Details
 */
async function refreshAccountDetails() {
  try {
    const data = await BankAPI.getMyAccount();
    currentAccountData = data;

    // Update Virtual Card & Stat Cards
    updateBalanceDisplay(data.balance);
    
    const accNumEl = document.getElementById('card-account-number');
    if (accNumEl) accNumEl.innerText = formatAccountNumber(data.accountNumber);

    const accStatusEl = document.getElementById('card-account-status');
    if (accStatusEl) accStatusEl.innerText = (data.accountStatus || 'ACTIVE') + ' SAVINGS';
  } catch (error) {
    console.error('Account details error:', error);
    throw error;
  }
}

/**
 * Refresh Transaction History & Stats
 */
async function refreshTransactionHistory() {
  const listContainer = document.getElementById('transaction-list');
  try {
    listContainer.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
        <p>Loading transactions... ⏳</p>
      </div>`;

    const data = await BankAPI.getHistory();
    allTransactions = Array.isArray(data) ? data : [];

    // Calculate Summary Stats
    let totalReceived = 0;
    let totalSent = 0;

    allTransactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.direction === 'RECEIVE') {
        totalReceived += amt;
      } else if (tx.direction === 'SEND') {
        totalSent += amt;
      }
    });

    const statReceived = document.getElementById('stat-received');
    if (statReceived) statReceived.innerText = `+₹ ${formatCurrency(totalReceived)}`;

    const statSent = document.getElementById('stat-sent');
    if (statSent) statSent.innerText = `-₹ ${formatCurrency(totalSent)}`;

    renderTransactions();
  } catch (error) {
    listContainer.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: var(--rose);">
        <p>Failed to load transactions</p>
      </div>`;
  }
}

/**
 * Render Filtered Transactions
 */
function renderTransactions() {
  const listContainer = document.getElementById('transaction-list');
  const searchQuery = (document.getElementById('tx-search-input')?.value || '').toLowerCase().trim();

  let filtered = allTransactions.filter(tx => {
    // Filter Tab
    if (currentTxFilter === 'SENT' && tx.direction !== 'SEND') return false;
    if (currentTxFilter === 'RECEIVED' && tx.direction !== 'RECEIVE') return false;

    // Search Query
    if (searchQuery && !tx.otherAccount?.toLowerCase().includes(searchQuery)) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <p style="font-weight: 600; font-size: 0.95rem;">No transactions found</p>
        <small style="color: var(--text-dim);">Transfers and deposits will appear here</small>
      </div>`;
    return;
  }

  listContainer.innerHTML = filtered.map(tx => {
    const isSend = tx.direction === 'SEND';
    const sign = isSend ? '-' : '+';
    const icon = isSend ? '↗' : '↙';
    const iconClass = isSend ? 'send' : 'receive';
    const amountClass = isSend ? 'send' : 'receive';
    const title = isSend ? `Transfer to ${tx.otherAccount || 'Account'}` : `Received from ${tx.otherAccount || 'Account'}`;
    const dateFormatted = formatDateTime(tx.createdAt);

    return `
      <div class="transaction-row">
        <div class="t-left">
          <div class="t-icon ${iconClass}">${icon}</div>
          <div class="t-info">
            <h4>${title}</h4>
            <p>${dateFormatted}</p>
          </div>
        </div>
        <div class="t-right">
          <div class="t-amount ${amountClass}">${sign}₹${formatCurrency(tx.amount)}</div>
          <span class="t-status">${tx.status || 'COMPLETED'}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Handle Money Transfer
 */
async function handleTransferSubmit(event) {
  event.preventDefault();
  const receiverAccountNumber = document.getElementById('transfer-account').value.trim();
  const amount = parseFloat(document.getElementById('transfer-amount').value);
  const submitBtn = document.getElementById('transfer-submit-btn');

  if (!receiverAccountNumber) {
    showToast('Enter recipient account number', 'warning');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast('Enter a valid amount greater than 0', 'warning');
    return;
  }

  if (currentAccountData && amount > currentAccountData.balance) {
    showToast('Insufficient balance for this transfer!', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending... ⏳';

    const response = await BankAPI.transfer({
      receiverAccountNumber,
      amount
    });

    showToast(response || 'Transfer completed successfully! 🎉', 'success');
    closeModal('transfer-modal');
    document.getElementById('transfer-form').reset();

    // Auto-refresh Balance and Passbook
    await refreshAccountDetails();
    await refreshTransactionHistory();
  } catch (error) {
    showToast(error.message || 'Transfer failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirm & Send';
  }
}

/**
 * UI Helpers
 */
function setTransferChipAmount(val) {
  const amountInput = document.getElementById('transfer-amount');
  if (amountInput) {
    amountInput.value = val;
  }
}

function filterTransactions(type, button) {
  currentTxFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (button) button.classList.add('active');
  renderTransactions();
}

function toggleBalanceVisibility() {
  isBalanceHidden = !isBalanceHidden;
  const balanceEl = document.getElementById('card-balance-val');
  const eyeBtn = document.getElementById('balance-toggle-btn');

  if (isBalanceHidden) {
    balanceEl.innerText = '₹ ••••••••';
    if (eyeBtn) eyeBtn.innerText = '👁️';
  } else {
    balanceEl.innerText = `₹ ${formatCurrency(currentAccountData?.balance || 0)}`;
    if (eyeBtn) eyeBtn.innerText = '🙈';
  }
}

function updateBalanceDisplay(amount) {
  const balanceEl = document.getElementById('card-balance-val');
  const statBal = document.getElementById('stat-balance');
  
  if (statBal) {
    statBal.innerText = `₹ ${formatCurrency(amount || 0)}`;
  }
  
  if (!isBalanceHidden && balanceEl) {
    balanceEl.innerText = `₹ ${formatCurrency(amount || 0)}`;
  }
}

function copyAccountNumber() {
  if (!currentAccountData?.accountNumber) return;
  navigator.clipboard.writeText(currentAccountData.accountNumber);
  showToast(`Copied: ${currentAccountData.accountNumber}`, 'info');
}

function exportStatementCSV() {
  if (allTransactions.length === 0) {
    showToast('No transactions to export', 'warning');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,Type,Other Account,Amount,Date,Status\n';
  allTransactions.forEach(tx => {
    csvContent += `"${tx.direction}","${tx.otherAccount}","${tx.amount}","${tx.createdAt}","${tx.status}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `NovaBank_Statement_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Statement exported to CSV', 'success');
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatAccountNumber(acc) {
  if (!acc) return '•••• •••• ••••';
  return acc.replace(/(\w{4})/g, '$1 ').trim();
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
