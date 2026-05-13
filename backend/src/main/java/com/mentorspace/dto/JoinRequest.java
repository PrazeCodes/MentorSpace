package com.mentorspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequest {

    @NotBlank
    @Size(min = 6, max = 6, message = "Join code must be 6 characters")
    private String joinCode;
}
