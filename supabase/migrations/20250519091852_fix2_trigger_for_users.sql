create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into porton.profiles (
    id,
    first_name,
    role,
    phone_number
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'role',
    new.phone
  );
  return new;
end;
$$;