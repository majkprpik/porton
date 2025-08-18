create or replace function porton.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into porton.profiles (id, first_name, last_name, role)
  values (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'role'
  );
  return new;
end;
$$;