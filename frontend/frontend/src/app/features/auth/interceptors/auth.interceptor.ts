import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Check if the request body is FormData
  const isFormData = req.body instanceof FormData;

  // Build headers object conditionally
  const headers: { [key: string]: string } = {};
  
  // Only set Content-Type for non-FormData requests
  // FormData requests need the browser to set Content-Type with boundary
  if (!isFormData && !req.headers.has('Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token exists and not already set
  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let authReq = req.clone({
    withCredentials: true,
    ...(Object.keys(headers).length > 0 && { setHeaders: headers })
  });

  return next(authReq);
};
