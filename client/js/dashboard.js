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
  document.getElementById('user-email-display').innerText = user.email;
  document.getElementById('card-holder-name').innerText = user.email.split('@')[0];

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

    // Update Virtual Card & Balance UI
    updateBalanceDisplay(data.balance);
    document.getElementById('card-account-number').innerText = formatAccountNumber(data.accountNumber);
    document.getElementById('card-account-status').innerText = data.accountStatus || 'ACTIVE';
    document.getElementById('card-account-type').innerText = (data.accountType || 'SAVINGS') + ' ACCOUNT';
  } catch (error) {
    console.error('Account details error:', error);
    throw error;
  }
}

/**
 * Refresh Transaction History
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
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📄</div>
        <p style="font-size: 1rem; color: var(--text-muted);">No transactions found</p>
        <small>Money transfers and deposits will appear here</small>
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
      <div class="transaction-item">
        <div class="tx-left">
          <div class="tx-icon ${iconClass}">${icon}</div>
          <div class="tx-details">
            <h4>${title}</h4>
            <p>${dateFormatted}</p>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${amountClass}">${sign}₹${formatCurrency(tx.amount)}</div>
          <span class="tx-badge">${tx.status || 'SUCCESS'}</span>
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
    submitBtn.innerHTML = 'Processing Transfer... ⏳';

    const response = await BankAPI.transfer({
      receiverAccountNumber,
      amount
    });

    showToast(response || 'Transfer completed successfully! 🎉', 'success');
    closeModal('transfer-modal');

    // Reset Form
    document.getElementById('transfer-form').reset();

    // Auto-refresh Balance and Passbook
    await refreshAccountDetails();
    await refreshTransactionHistory();
  } catch (error) {
    showToast(error.message || 'Transfer failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirm & Transfer Money';
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
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  if (button) button.classList.add('active');
  renderTransactions();
}

function toggleBalanceVisibility() {
  isBalanceHidden = !isBalanceHidden;
  const balanceEl = document.getElementById('card-balance-val');
  const eyeBtn = document.getElementById('balance-toggle-btn');

  if (isBalanceHidden) {
    balanceEl.innerText = '₹ ••••••••';
    eyeBtn.innerText = '👁️';
  } else {
    balanceEl.innerText = `₹ ${formatCurrency(currentAccountData?.balance || 0)}`;
    eyeBtn.innerText = '🙈';
  }
}

function updateBalanceDisplay(amount) {
  const balanceEl = document.getElementById('card-balance-val');
  if (!isBalanceHidden) {
    balanceEl.innerText = `₹ ${formatCurrency(amount || 0)}`;
  }
}

function copyAccountNumber() {
  if (!currentAccountData?.accountNumber) return;
  navigator.clipboard.writeText(currentAccountData.accountNumber);
  showToast(`Copied Account Number: ${currentAccountData.accountNumber}`, 'info');
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
  showToast('Statement downloaded as CSV!', 'success');
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
