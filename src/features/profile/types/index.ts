export interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface PasswordFormState {
  current_password: string;
  new_password: string;
  confirm_password: string;
  logout_other_sessions?: boolean;
}

