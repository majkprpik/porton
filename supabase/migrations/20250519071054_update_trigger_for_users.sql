create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    role,
    phone_number
  )
  values (
    new.id,
    new.user_metadata ->> 'display_name',
    new.user_metadata ->> 'role',
    new.phone
  );
  return new;
end;
$$;