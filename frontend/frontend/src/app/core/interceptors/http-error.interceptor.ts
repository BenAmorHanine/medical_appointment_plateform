import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred!';

            if (error.error instanceof ErrorEvent) {
                // Erreur côté client ou réseau
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Erreur côté serveur
                if (error.status === 401) {
                    // Non autorisé - redirection login
                    // router.navigate(['/login']); // Décommenter si vous avez une route login
                    errorMessage = 'Session expired or invalid credentials.';
                } else if (error.status === 403) {
                    errorMessage = 'You do not have permission to access this resource.';
                } else if (error.status === 404) {
                    errorMessage = 'Resource not found.';
                } else if (error.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else {
                    errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
                }
            }

            // Vous pouvez utiliser un service de notification ici (SnackBar, Toast, etc.)
            console.error('Global Error Handler:', errorMessage, error);

            // Relance l'erreur pour que les composants puissent gérer des cas spécifiques si besoin
            return throwError(() => error);
        })
    );
};
