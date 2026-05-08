import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /**
   * The email address for the new account.
   * @example ada@example.com
   */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /**
   * The password for the new account.
   * @example secret123
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  /**
   * The full name of the user/owner
   * @example "Hammed Anuoluwapo"
   */
  @IsString()
  @MinLength(2)
  name!: string;
}

export class RegisterResponse {
  /**
   * The unique identifier of the newly created account.
   * @example 01J...
   */
  accountId!: string;

  /**
   * The email address associated with the account.
   * @example ada@example.com
   */
  email!: string;

  /**
   * The date and time when the account was created.
   */
  createdAt!: Date;
}
