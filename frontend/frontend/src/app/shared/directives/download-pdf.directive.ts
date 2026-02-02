import { Directive, HostListener, Input, ElementRef, Renderer2, inject, signal } from '@angular/core';
import { ConsultationFacadeService } from '../../features/consultations/services/consultation-facade.service';
import { finalize } from 'rxjs';

@Directive({
    selector: '[appDownloadPdf]',
    standalone: true
})
export class DownloadPdfDirective {
    @Input('appDownloadPdf') url: string | null = null;

    private facade = inject(ConsultationFacadeService);
    private elementRef = inject(ElementRef);
    private renderer = inject(Renderer2);

    private originalContent: string = '';
    private isLoading = signal(false);

    @HostListener('click', ['$event'])
    onClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        if (this.isLoading() || !this.url) return;

        this.startLoading();

        this.facade.openPdfUrl(this.url).pipe(
            finalize(() => this.stopLoading())
        ).subscribe();
    }

    private startLoading(): void {
        this.isLoading.set(true);
        const button = this.elementRef.nativeElement as HTMLButtonElement;

        // Sauvegarder le contenu original
        this.originalContent = button.innerHTML;

        // Désactiver le bouton
        this.renderer.setAttribute(button, 'disabled', 'true');

        // Afficher le spinner
        button.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>Downloading...';
    }

    private stopLoading(): void {
        this.isLoading.set(false);
        const button = this.elementRef.nativeElement as HTMLButtonElement;

        // Restaurer le bouton
        this.renderer.removeAttribute(button, 'disabled');
        button.innerHTML = this.originalContent;
    }
}
