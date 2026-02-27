-- Seed professional demo clinics for Sillah.
-- Safe to run repeatedly. Uses your table defaults for id/created_at.

insert into public.clinics (name, location, contact_number)
select seed.name, seed.location, seed.contact_number
from (
  values
    ('Sillah Preventive Clinic', 'Riyadh', '+966 50 000 0000'),
    ('City Health Clinic', 'Riyadh', '+966 11 234 5678'),
    ('Heart Care Center', 'Jeddah', '+966 12 345 6789'),
    ('Genetics & Wellness Clinic', 'Riyadh', '+966 11 456 7890'),
    ('Blood Health Institute', 'Dammam', '+966 13 567 8901'),
    ('Family Care Medical Center', 'Jeddah', '+966 12 678 9012'),
    ('Advanced Cardiology Center', 'Riyadh', '+966 11 789 0123')
) as seed(name, location, contact_number)
where not exists (
  select 1
  from public.clinics c
  where c.name = seed.name
);

-- Verification
select id, name, location, contact_number
from public.clinics
order by name;
