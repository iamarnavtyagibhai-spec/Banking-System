package com.ninjabank.userservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResendOtpRequest {

    private String email;
}