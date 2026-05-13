package com.mentorspace.dto;

import com.mentorspace.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @NotBlank @Email @Size(max = 254)
    private String email;

    @NotBlank @Size(min = 2, max = 100)
    private String name;

    @NotBlank @Size(min = 8, max = 128, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role must be MENTOR or STUDENT")
    private Role role;
}
