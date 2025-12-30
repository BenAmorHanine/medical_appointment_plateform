-- Script SQL pour modifier les dates des consultations et les rendre plus anciennes
-- À exécuter dans la base de données MySQL

-- Consultation 1: Il y a 7 jours
UPDATE consultations 
SET createdAt = DATE_SUB(NOW(), INTERVAL 7 DAY),
    updatedAt = DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM consultations 
        WHERE patientId = '02986bd8-ca0c-42cc-a5bf-e60d28da9c73'
        ORDER BY createdAt DESC
        LIMIT 1 OFFSET 0
    ) AS temp
);

-- Consultation 2: Il y a 14 jours
UPDATE consultations 
SET createdAt = DATE_SUB(NOW(), INTERVAL 14 DAY),
    updatedAt = DATE_SUB(NOW(), INTERVAL 14 DAY)
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM consultations 
        WHERE patientId = '02986bd8-ca0c-42cc-a5bf-e60d28da9c73'
        ORDER BY createdAt DESC
        LIMIT 1 OFFSET 1
    ) AS temp
);

-- Consultation 3: Il y a 30 jours
UPDATE consultations 
SET createdAt = DATE_SUB(NOW(), INTERVAL 30 DAY),
    updatedAt = DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM consultations 
        WHERE patientId = '02986bd8-ca0c-42cc-a5bf-e60d28da9c73'
        ORDER BY createdAt DESC
        LIMIT 1 OFFSET 2
    ) AS temp
);

-- Consultation 4: Il y a 60 jours
UPDATE consultations 
SET createdAt = DATE_SUB(NOW(), INTERVAL 60 DAY),
    updatedAt = DATE_SUB(NOW(), INTERVAL 60 DAY)
WHERE id IN (
    SELECT id FROM (
        SELECT id FROM consultations 
        WHERE patientId = '02986bd8-ca0c-42cc-a5bf-e60d28da9c73'
        ORDER BY createdAt DESC
        LIMIT 1 OFFSET 3
    ) AS temp
);

