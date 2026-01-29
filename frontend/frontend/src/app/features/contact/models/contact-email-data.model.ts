export interface ContactEmailData {
  subject: string;
  message: string;
  //optional (i dont need them anymore in backend bc i got them from jwt token)
  name?: string;
  email?: string;
  phone?: string;
  role?: string;

}
