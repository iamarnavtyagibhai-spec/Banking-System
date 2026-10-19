package com.ninjabank.userservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    private String email;
    private String newPassword;
}