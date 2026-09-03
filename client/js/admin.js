/* ==========================================================================
   NOVA BANK - ADMIN PORTAL CONTROLLER
   ========================================================================== */

/**
 * Handle Admin Deposit Submit
 */
async function handleAdminDepositSubmit(event) {
  event.preventDefault();
  const accountNumber = document.getElementById('admin-deposit-account').value.trim();
  const amount = parseFloat(document.getElementById('admin-deposit-amount').value);
  const submitBtn = document.getElementById('admin-deposit-submit-btn');

  if (!accountNumber) {
    showToast('Enter recipient account number', 'warning');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast('Enter a valid amount greater than 0', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Depositing Funds... ⏳';

    const response = await BankAPI.adminDeposit({
      accountNumber,
      amount
    });

    showToast(response || 'Deposit successful! Funds added to account.', 'success');
    closeModal('admin-deposit-modal');
    document.getElementById('admin-deposit-form').reset();

    // If user deposited into their own account, refresh dashboard
    if (currentAccountData && currentAccountData.accountNumber === accountNumber) {
      await refreshAccountDetails();
      await refreshTransactionHistory();
    }
  } catch (error) {
    showToast(error.message || 'Deposit failed. Ensure you have ADMIN privileges.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirm Deposit';
  }
}

function openAdminDepositForMe() {
  if (currentAccountData?.accountNumber) {
    document.getElementById('admin-deposit-account').value = currentAccountData.accountNumber;
  }
  openModal('admin-deposit-modal');
}
