/**
 * Domain interface for an authenticated user.
 * Infrastructure conforms to this — never the reverse.
 */
export interface IUser {
  id: string;
  googleId: string;
  email: string;
  username: string;
  createdAt: Date;
}
