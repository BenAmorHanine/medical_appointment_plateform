import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultationType } from '../models/consultation.model';

/**
 * Service pour gérer le formulaire de consultation
 */
@Injectable()
export class ConsultationFormService {
  private readonly fb = inject(FormBuilder);

  // Durées par défaut
  readonly DEFAULT_DURATIONS: Record<ConsultationType, number> = {
    [ConsultationType.STANDARD]: 30,
    [ConsultationType.CONTROLE]: 15,
    [ConsultationType.URGENCE]: 45,
  };

  readonly form: FormGroup = this.createForm();

  /**
   * Crée le formulaire de consultation
   */
  private createForm(): FormGroup {
    const form = this.fb.group({
      type: [ConsultationType.STANDARD, [Validators.required]],
      duration: [this.DEFAULT_DURATIONS[ConsultationType.STANDARD]],
      medicament: [null],
      joursRepos: [null],
    });

    // Auto-remplir la durée lors du changement de type
    form.get('type')?.valueChanges.subscribe((type: ConsultationType | null) => {
      if (type) {
        form.patchValue(
          { duration: this.DEFAULT_DURATIONS[type] },
          { emitEvent: false }
        );
      }
    });

    return form;
  }

  /**
   * Récupère les valeurs du formulaire
   */
  getValue() {
    return this.form.value;
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isValid(): boolean {
    return this.form.valid;
  }

  /**
   * Réinitialise le formulaire
   */
  reset(): void {
    this.form.reset({
      type: ConsultationType.STANDARD,
      duration: this.DEFAULT_DURATIONS[ConsultationType.STANDARD],
    });
  }
}
