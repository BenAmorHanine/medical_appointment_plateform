import {
    Directive,
    HostListener,
    Input,
    ElementRef,
    Renderer2,
    inject,
    signal,
    DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConsultationService } from '../../features/consultations/services/consultation.service';
import { finalize } from 'rxjs';

@Directive({
    selector: '[appDownloadPdf]',
    standalone: true
})
export class DownloadPdfDirective {
    /** L'URL du PDF à télécharger. Requis. */
    @Input({ required: true, alias: 'appDownloadPdf' }) url: string | null = null;

    private consultationService = inject(ConsultationService);
    /** Référence à l'élément bouton */
    private elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
    private renderer = inject(Renderer2);
    /** Pour le nettoyage des observables lors de la destruction du composant */
    private destroyRef = inject(DestroyRef);

    private originalContent: string = '';
    private isLoading = signal(false);

    @HostListener('click', ['$event'])
    onClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        if (this.isLoading() || !this.url) return;

        this.startLoading();

        this.consultationService.openPdfUrl(this.url)
            .pipe(
                // Sécurité : Annule la requête si la directive est détruite
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.stopLoading())
            )
            .subscribe({
                error: (err: any) => console.error('Erreur téléchargement PDF', err)
            });
    }

    private startLoading(): void {
        this.isLoading.set(true);
        const button = this.elementRef.nativeElement;

        // Sauvegarder le contenu original
        this.originalContent = button.innerHTML;

        // Désactiver le bouton via Renderer2
        this.renderer.setAttribute(button, 'disabled', 'true');

        // Afficher le spinner via Renderer2
        this.renderer.setProperty(button, 'innerHTML', '<i class="fa fa-spinner fa-spin me-2"></i>Downloading...');
    }

    private stopLoading(): void {
        this.isLoading.set(false);
        const button = this.elementRef.nativeElement;

        // Réactiver le bouton
        this.renderer.removeAttribute(button, 'disabled');

        // Restaurer le contenu original
        if (this.originalContent) {
            this.renderer.setProperty(button, 'innerHTML', this.originalContent);
        }
    }
}
