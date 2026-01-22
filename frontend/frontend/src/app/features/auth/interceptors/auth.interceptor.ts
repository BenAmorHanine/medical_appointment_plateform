import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // We use 'token' : AuthService.setSession uses localStorage.setItem('token', ...)
  const token = localStorage.getItem('token');

  if (token) {
    // Clone logic from Page 277 of your course
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
