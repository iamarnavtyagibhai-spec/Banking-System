package com.example.BankingSystem.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.BankingSystem.dto.AccountResponse;
import com.example.BankingSystem.dto.TransactionHistoryResponse;
import com.example.BankingSystem.dto.TransferRequest;
import com.example.BankingSystem.exception.InsufficientBalanceException;
import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.model.Transaction;
import com.example.BankingSystem.model.User;
import com.example.BankingSystem.model.enums.AccountStatus;
import com.example.BankingSystem.model.enums.AccountType;
import com.example.BankingSystem.model.enums.TransactionStatus;
import com.example.BankingSystem.model.enums.TransactionType;
import com.example.BankingSystem.repository.AccountRepository;
import com.example.BankingSystem.repository.TransactionRepository;
import com.example.BankingSystem.repository.UserRepository;
@Service
public class AccountServiceImpl implements AccountService {
     @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    TransactionRepository transactionRepository;
    public String getMyAccountDetails(){
    String email = SecurityContextHolder
        .getContext()
        .getAuthentication()
        .getName();


     User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));
     Account account = accountRepository.findByUser(user)
        .orElseThrow(() -> new RuntimeException("Account not found"));
     return account.getBalance().toString();





    }
    @Transactional
    @Override
    public String transfer(TransferRequest request){
     String email =
SecurityContextHolder
        .getContext()
        .getAuthentication()
        .getName();
     User senderUser = userRepository
        .findByEmail(email)
        .orElseThrow(() ->
                new RuntimeException("User not found"));
     Account senderAccount = accountRepository
        .findByUser(senderUser)
        .orElseThrow(() ->
                new RuntimeException("Sender account not found"));
     Account receiverAccount = accountRepository
        .findByAccountNumber(request.getReceiverAccountNumber())
        .orElseThrow(() ->
                new RuntimeException("Receiver account not found"));
        if (senderAccount.getAccountStatus() != AccountStatus.ACTIVE) {
    throw new RuntimeException("Sender account is not active");
}

if (receiverAccount.getAccountStatus() != AccountStatus.ACTIVE) {
    throw new RuntimeException("Receiver account is not active");
}
     if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
    throw new RuntimeException("Amount must be greater than zero");
}
if (senderAccount.getAccountNumber()
        .equals(receiverAccount.getAccountNumber())) {

    throw new RuntimeException(
            "You cannot transfer money to your own account");
}
if (senderAccount.getBalance()
        .compareTo(request.getAmount()) < 0) {
throw new InsufficientBalanceException();
}
senderAccount.setBalance(
        senderAccount.getBalance()
                .subtract(request.getAmount())
);
receiverAccount.setBalance(
        receiverAccount.getBalance()
                .add(request.getAmount())
);
Transaction transaction = new Transaction();

transaction.setSender(senderAccount);

transaction.setReceiver(receiverAccount);

transaction.setAmount(request.getAmount());

transaction.setCreatedAt(LocalDateTime.now());

transaction.setTransactionType(TransactionType.TRANSFER);

transaction.setStatus(TransactionStatus.SUCCESS);

transactionRepository.save(transaction);

return "Transfer Successful";
    }
@Override
public List<TransactionHistoryResponse> getTransactionHistory() {

    String email = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    Account currentAccount = accountRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Account not found"));


    List<Transaction> transactions =
            transactionRepository.findBySenderOrReceiver(
                    currentAccount,
                    currentAccount
            );

    List<TransactionHistoryResponse> responses = new ArrayList<>();

    for (Transaction t : transactions) {

        TransactionHistoryResponse response =
                new TransactionHistoryResponse();

        if (t.getSender().getId().equals(currentAccount.getId())) {

            response.setDirection("SEND");
            response.setOtherAccount(
                    t.getReceiver().getAccountNumber());

        } else {

            response.setDirection("RECEIVE");
            response.setOtherAccount(
                    t.getSender().getAccountNumber());
        }

        response.setAmount(t.getAmount());
        response.setCreatedAt(t.getCreatedAt());
        response.setStatus(t.getStatus());

        responses.add(response);
    }

    return responses;
}


@Override
public AccountResponse getMyAccount() {

    String email = SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getName();

    User user = userRepository
            .findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    Account account = accountRepository
            .findByUser(user)
            .orElseThrow(() -> new RuntimeException("Account not found"));

    AccountResponse response = new AccountResponse();

    response.setAccountNumber(account.getAccountNumber());
    response.setAccountType(account.getAccountType());
    response.setBalance(account.getBalance());
    response.setAccountStatus(account.getAccountStatus());

    return response;
}

}