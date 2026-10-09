export type ResetPasswordDto = {
    email: string;
    otp: string;
    newPassword: string;
}