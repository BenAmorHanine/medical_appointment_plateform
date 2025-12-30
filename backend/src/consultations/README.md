# Module Consultations

## Description
Module complet pour la gestion des consultations médicales avec génération de PDF (ordonnance + certificat).

## Structure

### Backend (NestJS)
- **Entity**: `ConsultationEntity` avec enum `ConsultationType` (standard, controle, urgence)
- **DTO**: `CreateConsultationDto` avec validations class-validator
- **Service**: 
  - Création de consultation
  - Calcul automatique de la durée selon le type
  - Génération PDF (mock pour l'instant)
- **Controller**: 
  - `POST /consultations` - Créer une consultation
  - `GET /consultations` - Lister toutes les consultations
  - `GET /consultations/doctor/:doctorId` - Lister les consultations d'un médecin spécifique
  - `GET /consultations/:id` - Récupérer une consultation
  - `GET /consultations/:id/pdf` - Télécharger le PDF

### Frontend (Angular)
- **Component**: `ConsultationComponent` avec formulaire réactif
- **Service**: `ConsultationService` pour les appels API
- **Route**: `/consultations`

## Utilisation

### Backend
1. Le module est déjà intégré dans `app.module.ts`
2. Les PDFs sont générés dans `uploads/consultations/`
3. Les fichiers statiques sont servis via `/uploads/*`

### Frontend
1. Accéder à `/consultations` dans l'application Angular
2. Remplir le formulaire avec:
   - ID Patient (UUID)
   - ID Médecin (UUID)
   - Type de consultation
   - Durée (optionnel, calculée automatiquement si vide)
   - ID Rendez-vous (optionnel)
3. Cliquer sur "Démarrer Consultation"
4. Utiliser les boutons pour générer, visualiser, télécharger ou imprimer le PDF

## Notes
- Les IDs peuvent être fictifs pour les tests
- Le PDF est actuellement un fichier texte mock (à remplacer par une vraie génération PDF avec pdfkit ou puppeteer)
- La durée par défaut: Standard=30min, Contrôle=15min, Urgence=45min

