-- Seed professional demo clinics for Sillah.
-- Safe to run multiple times: inserts only when clinic name does not already exist.

insert into public.clinics (id, name, location, contact_number, created_at)
select '4ecff95f-9ee9-4cd4-bf9b-68893d920001'::uuid, 'City Health Clinic', 'Riyadh', '+966 11 234 5678', now()
where not exists (select 1 from public.clinics where name = 'City Health Clinic');

insert into public.clinics (id, name, location, contact_number, created_at)
select '4ecff95f-9ee9-4cd4-bf9b-68893d920002'::uuid, 'Heart Care Center', 'Jeddah', '+966 12 345 6789', now()
where not exists (select 1 from public.clinics where name = 'Heart Care Center');

insert into public.clinics (id, name, location, contact_number, created_at)
select '4ecff95f-9ee9-4cd4-bf9b-68893d920003'::uuid, 'Genetics & Wellness Clinic', 'Riyadh', '+966 11 456 7890', now()
where not exists (select 1 from public.clinics where name = 'Genetics & Wellness Clinic');

insert into public.clinics (id, name, location, contact_number, created_at)
select '4ecff95f-9ee9-4cd4-bf9b-68893d920004'::uuid, 'Blood Health Institute', 'Dammam', '+966 13 567 8901', now()
where not exists (select 1 from public.clinics where name = 'Blood Health Institute');

insert into public.clinics (id, name, location, contact_number, created_at)
select '4ecff95f-9ee9-4cd4-bf9b-68893d920005'::uuid, 'Family Care Medical Center', 'Jeddah', '+966 12 678 9012', now()
where not exists (select 1 from public.clinics where name = 'Family Care Medical Center');

insert into public.clinics (id, name, location, contact_number, created_at)
select '4ecff95f-9ee9-4cd4-bf9b-68893d920006'::uuid, 'Advanced Cardiology Center', 'Riyadh', '+966 11 789 0123', now()
where not exists (select 1 from public.clinics where name = 'Advanced Cardiology Center');
